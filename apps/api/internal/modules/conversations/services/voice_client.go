package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"engflex-api/config"
	"engflex-api/internal/modules/conversations/dtos/responses"
)

// VoiceSessionBody is the per-session payload the engine parses.
type VoiceSessionBody struct {
	UserID         string `json:"userId"`
	ConversationID string `json:"conversationId"`
	MaxDuration    int    `json:"maxDuration"`
}

// StartRequest mirrors the Pipecat runner /start body.
type StartRequest struct {
	Transport               string           `json:"transport"`
	EnableDefaultICEServers bool             `json:"enableDefaultIceServers"`
	Body                    VoiceSessionBody `json:"body"`
}

// StartResponse is the engine's /start reply (cached for idempotent starts).
type StartResponse struct {
	SessionID string               `json:"sessionId"`
	ICEConfig *responses.IceConfig `json:"iceConfig,omitempty"`
}

// VoiceClient talks to the Python engine (dev runner or P3 supervisor).
type VoiceClient interface {
	Start(ctx context.Context, req StartRequest) (*StartResponse, error)
	Offer(ctx context.Context, engineSessionID, method string, body []byte) ([]byte, int, error)
}

type httpVoiceClient struct {
	baseURL      string
	http         *http.Client
	startTimeout time.Duration
	offerTimeout time.Duration
}

func NewHTTPVoiceClient(cfg config.VoiceConfig) VoiceClient {
	return &httpVoiceClient{
		baseURL:      cfg.ServiceURL,
		http:         &http.Client{},
		startTimeout: cfg.StartTimeout,
		offerTimeout: cfg.OfferTimeout,
	}
}

func (c *httpVoiceClient) Start(ctx context.Context, req StartRequest) (*StartResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, c.startTimeout)
	defer cancel()

	payload, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/start", bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("voice start failed: %d", resp.StatusCode)
	}
	var out StartResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	if out.SessionID == "" {
		return nil, fmt.Errorf("voice start returned an empty session id")
	}
	return &out, nil
}

func (c *httpVoiceClient) Offer(ctx context.Context, engineSessionID, method string, body []byte) ([]byte, int, error) {
	ctx, cancel := context.WithTimeout(ctx, c.offerTimeout)
	defer cancel()

	url := fmt.Sprintf("%s/sessions/%s/api/offer", c.baseURL, engineSessionID)
	httpReq, err := http.NewRequestWithContext(ctx, method, url, bytes.NewReader(body))
	if err != nil {
		return nil, 0, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, 0, err
	}
	return respBody, resp.StatusCode, nil
}
