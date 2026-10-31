package repositories

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
)

type ConversationTurnRepository interface {
	UpsertTurns(ctx context.Context, conversationID string, turns []*models.ConversationTurn) (int, error)
	ListTurns(ctx context.Context, conversationID string) ([]*models.ConversationTurn, error)

	ListTurnsWithFeedback(ctx context.Context, conversationID string) ([]*models.ConversationTurn, error)
	GetTurnByID(ctx context.Context, turnID string) (*models.ConversationTurn, error)
	GetTurnByPosition(ctx context.Context, conversationID string, position int) (*models.ConversationTurn, error)
	WithTx(tx *gorm.DB) ConversationTurnRepository
}

type conversationTurnRepository struct {
	db *gorm.DB
}

func NewConversationTurnRepository(db *gorm.DB) ConversationTurnRepository {
	return &conversationTurnRepository{db: db}
}

func (r *conversationTurnRepository) WithTx(tx *gorm.DB) ConversationTurnRepository {
	return &conversationTurnRepository{db: tx}
}

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
