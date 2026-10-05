package repositories

import (
	"context"

	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
)

// ConversationRepository is the DB access layer for the conversations table.
// Turns live in ConversationTurnRepository.
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

func (r *conversationRepository) Create(ctx context.Context, m *models.Conversation) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *conversationRepository) GetByID(ctx context.Context, id string) (*models.Conversation, error) {
	if _, err := parseID(id, "conversationId"); err != nil {
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
	if _, err := parseID(id, "conversationId"); err != nil {
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
	if _, err := parseID(id, "conversationId"); err != nil {
		return 0, err
	}
	res := r.db.WithContext(ctx).
		Model(&models.Conversation{}).
		Where("id = ? AND status = ?", id, from).
		Updates(map[string]any{"status": to, "updated_at": gorm.Expr("now()")})
	return res.RowsAffected, res.Error
}

func (r *conversationRepository) SetEnded(ctx context.Context, id string, durationSec *int) (int64, error) {
	if _, err := parseID(id, "conversationId"); err != nil {
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
