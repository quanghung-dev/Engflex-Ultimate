package repositories

import (
	"context"

	"gorm.io/gorm"

	"engflex-api/internal/database/models"
)

type ScenarioTopicRepository interface {
	GetByID(ctx context.Context, id string) (*models.ScenarioTopic, error)
	GetBySlug(ctx context.Context, slug string) (*models.ScenarioTopic, error)
	ListWithPreview(ctx context.Context, previewK int, difficulty *string, search string) ([]*models.ScenarioTopic, error)
	WithTx(tx *gorm.DB) ScenarioTopicRepository
}

type scenarioTopicRepository struct {
	db *gorm.DB
}

func NewScenarioTopicRepository(db *gorm.DB) ScenarioTopicRepository {
	return &scenarioTopicRepository{db: db}
}

func (r *scenarioTopicRepository) WithTx(tx *gorm.DB) ScenarioTopicRepository {
	return &scenarioTopicRepository{db: tx}
}

func (r *scenarioTopicRepository) GetByID(ctx context.Context, id string) (*models.ScenarioTopic, error) {
	if _, err := parseID(id, "topicId"); err != nil {
		return nil, err
	}
	var t models.ScenarioTopic
	if err := r.db.WithContext(ctx).First(&t, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *scenarioTopicRepository) GetBySlug(ctx context.Context, slug string) (*models.ScenarioTopic, error) {
	var t models.ScenarioTopic
	if err := r.db.WithContext(ctx).First(&t, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

const rankedIDs = `
SELECT ranked.id FROM (
    SELECT s2.id,
           ROW_NUMBER() OVER (PARTITION BY s2.topic_id ORDER BY s2.created_at ASC, s2.id ASC) AS rn
    FROM scenarios s2
    WHERE (CAST(? AS TEXT) IS NULL OR s2.cefr_level = CAST(? AS TEXT))
      AND (? = '' OR s2.title ILIKE '%' || ? || '%' OR s2.objective ILIKE '%' || ? || '%')
) AS ranked WHERE ranked.rn <= ?`

func (r *scenarioTopicRepository) ListWithPreview(ctx context.Context, previewK int, difficulty *string, search string) ([]*models.ScenarioTopic, error) {
	var dif any
	if difficulty != nil {
		dif = *difficulty
	}
	var topics []*models.ScenarioTopic
	if err := r.db.WithContext(ctx).
		Order("position ASC").
		Find(&topics).Error; err != nil {
		return nil, err
	}
	if len(topics) == 0 {
		return topics, nil
	}
	ids := make([]string, 0, len(topics))
	byID := make(map[string]*models.ScenarioTopic, len(topics))
	for _, t := range topics {
		ids = append(ids, t.ID)
		byID[t.ID] = t
	}
	var scenarios []*models.Scenario
	if err := r.db.WithContext(ctx).
		Model(&models.Scenario{}).
		Joins("Persona").
		Where("scenarios.topic_id IN ?", ids).
		Where("scenarios.id IN ("+rankedIDs+")", dif, dif, search, search, search, previewK).
		Order("scenarios.created_at ASC, scenarios.id ASC").
		Find(&scenarios).Error; err != nil {
		return nil, err
	}
	for _, s := range scenarios {
		t := byID[s.TopicID]
		if t == nil {
			continue
		}
		t.Scenarios = append(t.Scenarios, s)
	}
	return topics, nil
}
