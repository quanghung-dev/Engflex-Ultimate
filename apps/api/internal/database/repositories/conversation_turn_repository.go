package repositories

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
)

// ConversationTurnRepository is the DB access layer for the conversation_turns
// table. The conversation row itself lives in ConversationRepository.
//
// ListTurnsWithFeedback is the one method that reads a second table (feedbacks,
// joined through the read-only Feedback relation on the model). It lives here
// because it returns turns; the file is named for what comes back, not for
// every table the SQL happens to touch.
type ConversationTurnRepository interface {
	// UpsertTurns inserts the batch, keyed on (conversation_id, position) so
	// a retried batch stays idempotent. Returns the number of rows written.
	UpsertTurns(ctx context.Context, conversationID string, turns []*models.ConversationTurn) (int, error)
	ListTurns(ctx context.Context, conversationID string) ([]*models.ConversationTurn, error)
	// ListTurnsWithFeedback returns the transcript with each turn's coaching
	// record attached in one round trip. Joins (not Preload) because the page
	// always wants both: two queries would buy nothing.
	ListTurnsWithFeedback(ctx context.Context, conversationID string) ([]*models.ConversationTurn, error)
	GetTurnByID(ctx context.Context, turnID string) (*models.ConversationTurn, error)
	GetTurnByPosition(ctx context.Context, conversationID string, position int) (*models.ConversationTurn, error)
	WithTx(tx *gorm.DB) ConversationTurnRepository
}

type conversationTurnRepository struct {
	db *gorm.DB
}

// NewConversationTurnRepository builds the repository over the shared DB handle.
func NewConversationTurnRepository(db *gorm.DB) ConversationTurnRepository {
	return &conversationTurnRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *conversationTurnRepository) WithTx(tx *gorm.DB) ConversationTurnRepository {
	return &conversationTurnRepository{db: tx}
}

// UpsertTurns inserts the batch, keyed on (conversation_id, position) so a
// retried batch stays idempotent. A position that already exists has its text
// and interruption flag refreshed rather than skipped: the learner can correct
// a turn they have already spoken, and the corrected transcript has to replace
// the misheard one instead of being silently dropped. Role and position are
// deliberately NOT updated — they are structural, and a changed role at an
// existing position means the engine and the database disagree about history.
//
// A turn carrying a populated Feedback cannot duplicate the coaching row:
// Feedback is declared `gorm:"->"` on the model, so GORM excludes the relation
// from create. See models.ConversationTurn.Feedback.
func (r *conversationTurnRepository) UpsertTurns(ctx context.Context, conversationID string, turns []*models.ConversationTurn) (int, error) {
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

func (r *conversationTurnRepository) ListTurns(ctx context.Context, conversationID string) ([]*models.ConversationTurn, error) {
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

// ListTurnsWithFeedback returns the transcript with each turn's coaching
// record attached.
//
// The subject-type guard sits in Where, not in Joins("Feedback", ...): GORM
// v1.31.0 drops conditions passed to a named Joins. It is written against the
// join ALIAS ("Feedback"), not the table name — the alias shadows the bare
// name, so `feedbacks.subject_type` fails with SQLSTATE 42P01. The IS NULL
// branch keeps the LEFT JOIN's promise: a plain `= ?` would delete every turn
// with no feedback, because NULL = 'conversation_turn' is never true.
//
// Ownership is not re-checked here: the service proves the caller owns the
// conversation before this runs, and subject_id is the turn's uuid primary key.
func (r *conversationTurnRepository) ListTurnsWithFeedback(ctx context.Context, conversationID string) ([]*models.ConversationTurn, error) {
	if _, err := parseID(conversationID, "conversationId"); err != nil {
		return nil, err
	}
	var turns []*models.ConversationTurn
	if err := r.db.WithContext(ctx).
		Joins("Feedback").
		Where("conversation_turns.conversation_id = ?", conversationID).
		Where(`"Feedback".subject_type IS NULL OR "Feedback".subject_type = ?`, enums.FeedbackSubjectConversationTurn).
		Order("conversation_turns.position ASC").
		Find(&turns).Error; err != nil {
		return nil, err
	}
	return turns, nil
}

func (r *conversationTurnRepository) GetTurnByID(ctx context.Context, turnID string) (*models.ConversationTurn, error) {
	if _, err := parseID(turnID, "turnId"); err != nil {
		return nil, err
	}
	var turn models.ConversationTurn
	if err := r.db.WithContext(ctx).First(&turn, "id = ?", turnID).Error; err != nil {
		return nil, err
	}
	return &turn, nil
}

func (r *conversationTurnRepository) GetTurnByPosition(ctx context.Context, conversationID string, position int) (*models.ConversationTurn, error) {
	if _, err := parseID(conversationID, "conversationId"); err != nil {
		return nil, err
	}
	var turn models.ConversationTurn
	if err := r.db.WithContext(ctx).First(&turn, "conversation_id = ? AND position = ?", conversationID, position).Error; err != nil {
		return nil, err
	}
	return &turn, nil
}
