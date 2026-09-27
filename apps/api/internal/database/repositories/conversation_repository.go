package repositories

import (
	"context"

	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/utils"
)

// ConversationRepository is the DB access layer for voice conversations.
type ConversationRepository interface {
	Create(ctx context.Context, m *models.Conversation) error
	// CreateClosingActive atomically closes the caller's non-terminal
	// conversations and inserts the new one. Deliberate exception to the
	// "one method = one query" rule: the close + insert must be atomic, and
	// pushing the transaction into the service would require handing it a
	// concrete *gorm.DB (violating "constructors take interfaces").
	CreateClosingActive(ctx context.Context, m *models.Conversation) error
	GetByID(ctx context.Context, id string) (*models.Conversation, error)
	SetSpeechStart(ctx context.Context, id, speechSessionID string, startResponse []byte) (int64, error)
	SetStatus(ctx context.Context, id string, from, to enums.ConversationStatus) (int64, error)
	SetEnded(ctx context.Context, id string, durationSec *int) (int64, error)
	UpsertTurns(ctx context.Context, conversationID string, turns []*models.ConversationTurn) (int, error)
	ListTurns(ctx context.Context, conversationID string) ([]*models.ConversationTurn, error)
	GetTurnByID(ctx context.Context, turnID string) (*models.ConversationTurn, error)
	GetTurnByPosition(ctx context.Context, conversationID string, position int) (*models.ConversationTurn, error)
	WithTx(tx *gorm.DB) ConversationRepository
}

type conversationRepository struct {
	db *gorm.DB
}

// NewConversationRepository builds the repository over the shared DB handle.
func NewConversationRepository(db *gorm.DB) ConversationRepository {
	return &conversationRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *conversationRepository) WithTx(tx *gorm.DB) ConversationRepository {
	return &conversationRepository{db: tx}
}

func parseConversationID(id string) (string, error) {
	if _, err := utils.ParseUUID(id); err != nil {
		return "", &common.InvalidIDError{Name: "conversationId"}
	}
	return id, nil
}

func (r *conversationRepository) Create(ctx context.Context, m *models.Conversation) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *conversationRepository) GetByID(ctx context.Context, id string) (*models.Conversation, error) {
	if _, err := parseConversationID(id); err != nil {
		return nil, err
	}
	var m models.Conversation
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *conversationRepository) CreateClosingActive(ctx context.Context, m *models.Conversation) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Lock the caller's non-terminal rows so two concurrent creates
		// serialize instead of both slipping through.
		var ids []string
		if err := tx.Model(&models.Conversation{}).
			Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("user_id = ? AND status IN ?", m.UserID,
				[]enums.ConversationStatus{enums.ConversationStatusPending, enums.ConversationStatusLive}).
			Pluck("id", &ids).Error; err != nil {
			return err
		}
		if len(ids) > 0 {
			if err := tx.Model(&models.Conversation{}).
				Where("id IN ?", ids).
				Updates(map[string]any{
					"status":     enums.ConversationStatusEnded,
					"ended_at":   gorm.Expr("COALESCE(ended_at, now())"),
					"updated_at": gorm.Expr("now()"),
				}).Error; err != nil {
				return err
			}
		}
		return tx.Create(m).Error
	})
}

func (r *conversationRepository) SetSpeechStart(ctx context.Context, id, speechSessionID string, startResponse []byte) (int64, error) {
	if _, err := parseConversationID(id); err != nil {
		return 0, err
	}
	res := r.db.WithContext(ctx).
		Model(&models.Conversation{}).
		Where("id = ? AND status = ? AND COALESCE(speech_session_id, '') = ''", id, enums.ConversationStatusPending).
		Updates(map[string]any{
			"speech_session_id":     speechSessionID,
			"speech_start_response": datatypes.JSON(startResponse),
			"updated_at":            gorm.Expr("now()"),
		})
	return res.RowsAffected, res.Error
}

func (r *conversationRepository) SetStatus(ctx context.Context, id string, from, to enums.ConversationStatus) (int64, error) {
	if _, err := parseConversationID(id); err != nil {
		return 0, err
	}
	res := r.db.WithContext(ctx).
		Model(&models.Conversation{}).
		Where("id = ? AND status = ?", id, from).
		Updates(map[string]any{"status": to, "updated_at": gorm.Expr("now()")})
	return res.RowsAffected, res.Error
}

// UpsertTurns inserts the batch, keyed on (conversation_id, position) so a
// retried batch stays idempotent. A position that already exists has its text
// and interruption flag refreshed rather than skipped: the learner can correct
// a turn they have already spoken, and the corrected transcript has to replace
// the misheard one instead of being silently dropped. Role and position are
// deliberately NOT updated — they are structural, and a changed role at an
// existing position means the engine and the database disagree about history.
// Returns the number of rows written.
func (r *conversationRepository) UpsertTurns(ctx context.Context, conversationID string, turns []*models.ConversationTurn) (int, error) {
	if _, err := parseID(conversationID, "conversationId"); err != nil {
		return 0, err
	}
	if len(turns) == 0 {
		return 0, nil
	}
	res := r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "conversation_id"}, {Name: "position"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"text", "was_interrupted", "updated_at",
			}),
		}).
		Create(&turns)
	if res.Error != nil {
		return 0, res.Error
	}
	return int(res.RowsAffected), res.Error
}

func (r *conversationRepository) ListTurns(ctx context.Context, conversationID string) ([]*models.ConversationTurn, error) {
	if _, err := parseID(conversationID, "conversationId"); err != nil {
		return nil, err
	}
	var turns []*models.ConversationTurn
	if err := r.db.WithContext(ctx).
		Where("conversation_id = ?", conversationID).
		Order("position ASC").
		Find(&turns).Error; err != nil {
		return nil, err
	}
	return turns, nil
}

func (r *conversationRepository) GetTurnByID(ctx context.Context, turnID string) (*models.ConversationTurn, error) {
	if _, err := parseID(turnID, "turnId"); err != nil {
		return nil, err
	}
	var turn models.ConversationTurn
	if err := r.db.WithContext(ctx).First(&turn, "id = ?", turnID).Error; err != nil {
		return nil, err
	}
	return &turn, nil
}

func (r *conversationRepository) GetTurnByPosition(ctx context.Context, conversationID string, position int) (*models.ConversationTurn, error) {
	if _, err := parseConversationID(conversationID); err != nil {
		return nil, err
	}
	var turn models.ConversationTurn
	if err := r.db.WithContext(ctx).First(&turn, "conversation_id = ? AND position = ?", conversationID, position).Error; err != nil {
		return nil, err
	}
	return &turn, nil
}

func (r *conversationRepository) SetEnded(ctx context.Context, id string, durationSec *int) (int64, error) {
	if _, err := parseConversationID(id); err != nil {
		return 0, err
	}
	updates := map[string]any{
		"status":     gorm.Expr("CASE WHEN status = ? THEN status ELSE ? END", enums.ConversationStatusFailed, enums.ConversationStatusEnded),
		"ended_at":   gorm.Expr("COALESCE(ended_at, now())"),
		"updated_at": gorm.Expr("now()"),
	}
	if durationSec != nil {
		updates["duration_sec"] = gorm.Expr("COALESCE(duration_sec, ?)", *durationSec)
	}
	res := r.db.WithContext(ctx).
		Model(&models.Conversation{}).
		Where("id = ?", id).
		Updates(updates)
	return res.RowsAffected, res.Error
}
