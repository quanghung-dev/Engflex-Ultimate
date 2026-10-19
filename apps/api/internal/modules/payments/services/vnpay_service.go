package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"strconv"
	"time"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/payments/dtos/responses"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// VNPay IPN response codes, per VNPay's integration spec. The ack body is
// {"RspCode": code, "Message": message} — not the house common.ApiResponse
// envelope, because VNPay's own server parses this reply, not a browser.
const (
	vnpayRspSuccess          = "00"
	vnpayRspOrderNotFound    = "01"
	vnpayRspAlreadyConfirmed = "02"
	vnpayRspInvalidAmount    = "04"
	vnpayRspInvalidSignature = "97"
	vnpayRspUnknownError     = "99"
)

var vnpayRspMessages = map[string]string{
	vnpayRspSuccess:          "Confirm Success",
	vnpayRspOrderNotFound:    "Order not found",
	vnpayRspAlreadyConfirmed: "Order already confirmed",
	vnpayRspInvalidAmount:    "Invalid amount",
	vnpayRspInvalidSignature: "Invalid signature",
	vnpayRspUnknownError:     "Unknown error",
}

// VNPayAckMessage maps a VNPay RspCode to its spec-mandated message text,
// for the controller to build the {"RspCode","Message"} IPN ack body.
func VNPayAckMessage(code string) string {
	if msg, ok := vnpayRspMessages[code]; ok {
		return msg
	}
	return vnpayRspMessages[vnpayRspUnknownError]
}

// VNPayConfig is the subset of config.PaymentConfig the service needs,
// narrowed here so this package doesn't import the top-level config
// package (which would be the only such cross-import in this module tree).
type VNPayConfig struct {
	TmnCode    string
	HashSecret string
	PayURL     string
	ReturnURL  string
}

// VNPayService builds VNPay checkout URLs and verifies/handles the IPN
// callback that confirms or fails a payment attempt.
type VNPayService interface {
	BuildCheckoutURL(ctx context.Context, userID string, plan enums.SubscriptionPlan, clientIP string) (*responses.CheckoutSession, error)
	VerifyAndHandleIPN(ctx context.Context, query url.Values) (rspCode string, err error)
}

type vnpayService struct {
	cfg   VNPayConfig
	subs  repositories.SubscriptionRepository
	txns  repositories.PaymentTransactionRepository
	plans repositories.PlanRepository
}

// NewVNPayService builds the service over the repository interfaces and
// gateway config.
func NewVNPayService(cfg VNPayConfig, subs repositories.SubscriptionRepository, txns repositories.PaymentTransactionRepository, plans repositories.PlanRepository) VNPayService {
	return &vnpayService{cfg: cfg, subs: subs, txns: txns, plans: plans}
}

// generateTxnRef returns a time-prefixed random reference, unique enough
// for VNPay's per-merchant vnp_TxnRef requirement and the DB's own
// UNIQUE (provider, provider_txn_ref) constraint.
func generateTxnRef() string {
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	return time.Now().Format("20060102150405") + hex.EncodeToString(buf)
}

// BuildCheckoutURL creates the pending subscription + payment_transaction
// rows and returns the signed VNPay checkout URL to redirect the learner's
// browser to.
func (s *vnpayService) BuildCheckoutURL(ctx context.Context, userID string, plan enums.SubscriptionPlan, clientIP string) (*responses.CheckoutSession, error) {
	def, err := s.plans.GetByPlan(ctx, plan)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, common.BadRequest("unknown plan")
		}
		appErr := common.FromDBError(err, "plan")
		logger.Report(ctx, "load plan for checkout failed", appErr, "plan", plan)
		return nil, appErr
	}
	if !def.IsActive {
		return nil, common.BadRequest("plan is not available")
	}

	sub := &models.Subscription{
		UserID:   userID,
		Plan:     plan,
		Status:   enums.SubscriptionStatusPending,
		Amount:   def.Amount,
		Currency: def.Currency,
	}
	if err := s.subs.Create(ctx, sub); err != nil {
		appErr := common.FromDBError(err, "subscription")
		logger.Report(ctx, "create pending subscription failed", appErr, "user_id", userID)
		return nil, appErr
	}

	txnRef := generateTxnRef()
	txn := &models.PaymentTransaction{
		SubscriptionID: sub.ID,
		Provider:       "vnpay",
		ProviderTxnRef: txnRef,
		Amount:         def.Amount,
		Status:         enums.PaymentTransactionStatusPending,
	}
	if err := s.txns.Create(ctx, txn); err != nil {
		appErr := common.FromDBError(err, "payment transaction")
		logger.Report(ctx, "create payment transaction failed", appErr, "subscription_id", sub.ID)
		return nil, appErr
	}

	params := map[string]string{
		"vnp_Version":    "2.1.0",
		"vnp_Command":    "pay",
		"vnp_TmnCode":    s.cfg.TmnCode,
		"vnp_Amount":     strconv.FormatInt(def.Amount*100, 10),
		"vnp_CurrCode":   "VND",
		"vnp_TxnRef":     txnRef,
		"vnp_OrderInfo":  fmt.Sprintf("Thanh toan goi premium %s", plan),
		"vnp_OrderType":  "other",
		"vnp_Locale":     "vn",
		"vnp_ReturnUrl":  s.cfg.ReturnURL,
		"vnp_IpAddr":     clientIP,
		"vnp_CreateDate": time.Now().Format("20060102150405"),
	}
	secureHash := vnpaySign(params, s.cfg.HashSecret)

	q := url.Values{}
	for k, v := range params {
		q.Set(k, v)
	}
	q.Set("vnp_SecureHash", secureHash)

	paymentURL := s.cfg.PayURL + "?" + q.Encode()
	slog.InfoContext(ctx, "vnpay checkout created", "subscription_id", sub.ID, "txn_ref", txnRef, "plan", plan)
	return &responses.CheckoutSession{PaymentURL: paymentURL, TxnRef: txnRef}, nil
}

// VerifyAndHandleIPN verifies the callback signature, then applies the
// result to the matching payment_transaction + subscription rows. Replaying
// an already-processed vnp_TxnRef (same or different outcome) is a no-op —
// the first result to arrive wins and nothing is double-applied.
func (s *vnpayService) VerifyAndHandleIPN(ctx context.Context, query url.Values) (string, error) {
	gotHash := query.Get("vnp_SecureHash")
	wantHash := vnpaySignQuery(query, s.cfg.HashSecret)
	if gotHash == "" || gotHash != wantHash {
		slog.WarnContext(ctx, "vnpay ipn rejected: bad signature", "txn_ref", query.Get("vnp_TxnRef"))
		return vnpayRspInvalidSignature, nil
	}

	txnRef := query.Get("vnp_TxnRef")
	txn, err := s.txns.GetByProviderTxnRef(ctx, "vnpay", txnRef)
	if err != nil {
		slog.WarnContext(ctx, "vnpay ipn rejected: unknown txn_ref", "txn_ref", txnRef)
		return vnpayRspOrderNotFound, nil
	}

	if txn.Status != enums.PaymentTransactionStatusPending {
		// Already processed — replay is a no-op, not an error.
		return vnpayRspAlreadyConfirmed, nil
	}

	gotAmount, parseErr := strconv.ParseInt(query.Get("vnp_Amount"), 10, 64)
	if parseErr != nil || gotAmount != txn.Amount*100 {
		return vnpayRspInvalidAmount, nil
	}

	responseCode := query.Get("vnp_ResponseCode")
	transactionNo := query.Get("vnp_TransactionNo")
	raw, _ := json.Marshal(query)

	if err := s.txns.UpdateResult(ctx, txn.ID, statusForResponseCode(responseCode), strPtr(transactionNo), strPtr(responseCode), datatypes.JSON(raw)); err != nil {
		appErr := common.FromDBError(err, "payment transaction")
		logger.Report(ctx, "update payment transaction failed", appErr, "txn_ref", txnRef)
		return vnpayRspUnknownError, appErr
	}

	if responseCode == "00" {
		now := time.Now()
		sub, subErr := s.subs.GetByID(ctx, txn.SubscriptionID)
		if subErr != nil {
			appErr := common.FromDBError(subErr, "subscription")
			logger.Report(ctx, "load subscription for ipn failed", appErr, "subscription_id", txn.SubscriptionID)
			return vnpayRspUnknownError, appErr
		}
		planDef, planErr := s.plans.GetByPlan(ctx, sub.Plan)
		if planErr != nil {
			appErr := common.FromDBError(planErr, "plan")
			logger.Report(ctx, "load plan for ipn failed", appErr, "plan", sub.Plan)
			return vnpayRspUnknownError, appErr
		}
		end := now.AddDate(0, planDef.Months, 0)
		if err := s.subs.UpdateStatus(ctx, txn.SubscriptionID, enums.SubscriptionStatusActive, &now, &end); err != nil {
			appErr := common.FromDBError(err, "subscription")
			logger.Report(ctx, "activate subscription failed", appErr, "subscription_id", txn.SubscriptionID)
			return vnpayRspUnknownError, appErr
		}
		slog.InfoContext(ctx, "vnpay payment succeeded", "subscription_id", txn.SubscriptionID, "txn_ref", txnRef)
	} else {
		if err := s.subs.UpdateStatus(ctx, txn.SubscriptionID, enums.SubscriptionStatusFailed, nil, nil); err != nil {
			appErr := common.FromDBError(err, "subscription")
			logger.Report(ctx, "mark subscription failed failed", appErr, "subscription_id", txn.SubscriptionID)
			return vnpayRspUnknownError, appErr
		}
		slog.InfoContext(ctx, "vnpay payment failed", "subscription_id", txn.SubscriptionID, "txn_ref", txnRef, "response_code", responseCode)
	}

	return vnpayRspSuccess, nil
}

func statusForResponseCode(code string) enums.PaymentTransactionStatus {
	if code == "00" {
		return enums.PaymentTransactionStatusSucceeded
	}
	return enums.PaymentTransactionStatusFailed
}

func strPtr(s string) *string { return &s }
