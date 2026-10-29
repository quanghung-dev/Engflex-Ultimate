package repositories

import (
	"context"

	"gorm.io/gorm"

	"engflex-api/internal/database/models"
)

type ScenarioRepository interface {
	List(ctx context.Context, topicID *string, random bool, limit, offset int) ([]*models.Scenario, error)
	Count(ctx context.Context, topicID *string) (int64, error)
	GetByID(ctx context.Context, id string) (*models.Scenario, error)
	GetDetail(ctx context.Context, id string) (*models.Scenario, error)
	WithTx(tx *gorm.DB) ScenarioRepository
}

type scenarioRepository struct {
	db *gorm.DB
}

func NewScenarioRepository(db *gorm.DB) ScenarioRepository {
	return &scenarioRepository{db: db}
}

func (r *scenarioRepository) WithTx(tx *gorm.DB) ScenarioRepository {
	return &scenarioRepository{db: tx}
}

func (r *scenarioRepository) List(ctx context.Context, topicID *string, random bool, limit, offset int) ([]*models.Scenario, error) {
	q := r.db.WithContext(ctx).Model(&models.Scenario{})
	if topicID != nil && *topicID != "" {
		q = q.Where("topic_id = ?", *topicID)
	}
	if random {
		q = q.Order("random()")
	} else {
		q = q.Order("created_at DESC")
	}
	var out []*models.Scenario
	if err := q.Limit(limit).Offset(offset).Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *scenarioRepository) Count(ctx context.Context, topicID *string) (int64, error) {
	q := r.db.WithContext(ctx).Model(&models.Scenario{})
	if topicID != nil && *topicID != "" {
		q = q.Where("topic_id = ?", *topicID)
	}
	var n int64
	if err := q.Count(&n).Error; err != nil {
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

func (r *scenarioRepository) GetDetail(ctx context.Context, id string) (*models.Scenario, error) {
	if _, err := parseID(id, "scenarioId"); err != nil {
		return nil, err
	}
	var m models.Scenario
	if err := r.db.WithContext(ctx).
		Joins("Topic").
		Joins("Persona").
		Where("scenarios.id = ?", id).
		First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}
