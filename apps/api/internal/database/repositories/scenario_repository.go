package repositories

import (
	"context"

	"gorm.io/gorm"

	"engflex-api/internal/database/models"
)

// ScenarioRepository is the DB access layer for roleplay scenarios.
type ScenarioRepository interface {
	List(ctx context.Context, topicID *string, limit, offset int) ([]*models.Scenario, error)
	Count(ctx context.Context, topicID *string) (int64, error)
	ListForUser(ctx context.Context, userID string, limit, offset int) ([]*models.Scenario, error)
	CountForUser(ctx context.Context, userID string) (int64, error)
	GetByID(ctx context.Context, id string) (*models.Scenario, error)
	GetTopicBySlug(ctx context.Context, slug string) (*models.ScenarioTopic, error)
	Create(ctx context.Context, m *models.Scenario) error
	WithTx(tx *gorm.DB) ScenarioRepository
}

type scenarioRepository struct {
	db *gorm.DB
}

// NewScenarioRepository builds the repository over the shared DB handle.
func NewScenarioRepository(db *gorm.DB) ScenarioRepository {
	return &scenarioRepository{db: db}
}

// WithTx returns the repository bound to the given transaction handle.
func (r *scenarioRepository) WithTx(tx *gorm.DB) ScenarioRepository {
	return &scenarioRepository{db: tx}
}

func (r *scenarioRepository) List(ctx context.Context, topicID *string, limit, offset int) ([]*models.Scenario, error) {
	q := r.db.WithContext(ctx).Model(&models.Scenario{}).Where("user_id IS NULL")
	if topicID != nil && *topicID != "" {
		q = q.Where("topic_id = ?", *topicID)
	}
	var out []*models.Scenario
	if err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *scenarioRepository) Count(ctx context.Context, topicID *string) (int64, error) {
	q := r.db.WithContext(ctx).Model(&models.Scenario{}).Where("user_id IS NULL")
	if topicID != nil && *topicID != "" {
		q = q.Where("topic_id = ?", *topicID)
	}
	var n int64
	if err := q.Count(&n).Error; err != nil {
		return 0, err
	}
	return n, nil
}

func (r *scenarioRepository) ListForUser(ctx context.Context, userID string, limit, offset int) ([]*models.Scenario, error) {
	var out []*models.Scenario
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *scenarioRepository) CountForUser(ctx context.Context, userID string) (int64, error) {
	var n int64
	if err := r.db.WithContext(ctx).
		Model(&models.Scenario{}).
		Where("user_id = ?", userID).
		Count(&n).Error; err != nil {
		return 0, err
	}
	return n, nil
}

func (r *scenarioRepository) GetByID(ctx context.Context, id string) (*models.Scenario, error) {
	if _, err := parseID(id, "scenarioId"); err != nil {
		return nil, err
	}
	var m models.Scenario
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *scenarioRepository) GetTopicBySlug(ctx context.Context, slug string) (*models.ScenarioTopic, error) {
	var t models.ScenarioTopic
	if err := r.db.WithContext(ctx).First(&t, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *scenarioRepository) Create(ctx context.Context, m *models.Scenario) error {
	return r.db.WithContext(ctx).Create(m).Error
}
