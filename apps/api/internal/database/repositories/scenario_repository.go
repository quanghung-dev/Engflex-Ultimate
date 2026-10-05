package repositories

import (
	"context"

	"gorm.io/gorm"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
)

// ScenarioRepository is the DB access layer for roleplay scenarios.
type ScenarioRepository interface {
	List(ctx context.Context, topicID *string, limit, offset int) ([]*models.Scenario, error)
	Count(ctx context.Context, topicID *string) (int64, error)
	ListForUser(ctx context.Context, userID string, limit, offset int) ([]*models.Scenario, error)
	CountForUser(ctx context.Context, userID string) (int64, error)
	GetByID(ctx context.Context, id string) (*models.Scenario, error)
	GetDetail(ctx context.Context, id string) (*models.Scenario, error)
	GetTopicByID(ctx context.Context, id string) (*models.ScenarioTopic, error)
	GetTopicBySlug(ctx context.Context, slug string) (*models.ScenarioTopic, error)
	ListTopicsWithPreview(ctx context.Context, previewK int, difficulty *string, search string) ([]TopicWithPreview, error)
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

// GetDetail returns the scenario with its topic and partner persona in a
// single query. Joins (not Preload) issues one round trip: Preload fans out
// to a query per association, which is exactly the N+1 this replaces. Both
// joins are LEFT, so a scenario without a persona comes back with nil
// Persona instead of vanishing.
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

func (r *scenarioRepository) GetTopicByID(ctx context.Context, id string) (*models.ScenarioTopic, error) {
	if _, err := parseID(id, "topicId"); err != nil {
		return nil, err
	}
	var t models.ScenarioTopic
	if err := r.db.WithContext(ctx).First(&t, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *scenarioRepository) GetTopicBySlug(ctx context.Context, slug string) (*models.ScenarioTopic, error) {
	var t models.ScenarioTopic
	if err := r.db.WithContext(ctx).First(&t, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

// TopicWithPreview is one banner row with its top-k scenarios, built by a
// single joined query (never one query per topic).
type TopicWithPreview struct {
	Topic     *models.ScenarioTopic
	Scenarios []*models.Scenario
}

type topicPreviewRow struct {
	TopicID         string                `gorm:"column:topic_id"`
	TopicSlug       string                `gorm:"column:topic_slug"`
	TopicName       string                `gorm:"column:topic_name"`
	TopicPosition   int                   `gorm:"column:topic_position"`
	ScenarioID      *string               `gorm:"column:scenario_id"`
	ScenarioTopicID *string               `gorm:"column:scenario_topic_id"`
	PersonaID       *string               `gorm:"column:persona_id"`
	Title           *string               `gorm:"column:title"`
	Objective       *string               `gorm:"column:objective"`
	CEFRLevel       *string               `gorm:"column:cefr_level"`
	MaxDuration     int                   `gorm:"column:max_duration"`
	Details         models.ScenarioDetail `gorm:"column:details"`
	UserID          *string               `gorm:"column:user_id"`
	PersonaName     *string               `gorm:"column:persona_name"`
	PersonaRole     *string               `gorm:"column:persona_role_title"`
	PersonaTrait    *string               `gorm:"column:persona_personality"`
}

func strVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// previewPersona rebuilds the partner from the joined columns. Nil id means
// the LEFT JOIN found nothing — the card renders the generic label.
func previewPersona(row topicPreviewRow) *models.Persona {
	if row.PersonaID == nil {
		return nil
	}
	return &models.Persona{
		ID:          *row.PersonaID,
		Name:        strVal(row.PersonaName),
		RoleTitle:   strVal(row.PersonaRole),
		Personality: row.PersonaTrait,
	}
}

// ListTopicsWithPreview returns every non-custom topic ordered by position,
// each with up to previewK built-in scenarios in one round trip: the join
// ranks scenarios per topic with a window function, so topics with zero
// scenarios still appear (empty preview) and no N+1 fan-out exists.
func (r *scenarioRepository) ListTopicsWithPreview(ctx context.Context, previewK int, difficulty *string, search string) ([]TopicWithPreview, error) {
	var dif any
	if difficulty != nil {
		dif = *difficulty
	}
	var rows []topicPreviewRow
	if err := r.db.WithContext(ctx).Raw(`
SELECT t.id AS topic_id, t.slug AS topic_slug, t.name AS topic_name, t.position AS topic_position,
       s.id AS scenario_id, s.topic_id AS scenario_topic_id, s.persona_id, s.title, s.objective,
       s.cefr_level, s.max_duration, s.details, s.user_id
FROM scenario_topics t
LEFT JOIN (
	SELECT s.id, s.topic_id, s.persona_id, s.title, s.objective,
	       s.cefr_level, s.max_duration, s.details, s.user_id,
	       s.created_at,
	       p.name AS persona_name, p.role_title AS persona_role_title,
	       p.personality AS persona_personality,
	       ROW_NUMBER() OVER (PARTITION BY s.topic_id ORDER BY s.created_at ASC) AS rn
	FROM scenarios s
	LEFT JOIN personas p ON p.id = s.persona_id
	WHERE s.user_id IS NULL
		AND (CAST(? AS TEXT) IS NULL OR s.cefr_level = CAST(? AS TEXT))
		AND (? = '' OR s.title ILIKE '%' || ? || '%' OR s.objective ILIKE '%' || ? || '%')
) s ON s.topic_id = t.id AND s.rn <= ?
WHERE t.slug <> 'custom'
ORDER BY t.position ASC, s.rn ASC`,
		dif, dif, search, search, search, previewK,
	).Scan(&rows).Error; err != nil {
		return nil, err
	}
	grouped := make([]TopicWithPreview, 0)
	index := map[string]int{}
	for _, row := range rows {
		i, ok := index[row.TopicID]
		if !ok {
			grouped = append(grouped, TopicWithPreview{
				Topic: &models.ScenarioTopic{
					ID: row.TopicID, Slug: row.TopicSlug, Name: row.TopicName, Position: row.TopicPosition,
				},
			})
			i = len(grouped) - 1
			index[row.TopicID] = i
		}
		if row.ScenarioID == nil {
			continue
		}
		grouped[i].Scenarios = append(grouped[i].Scenarios, &models.Scenario{
			ID:          *row.ScenarioID,
			TopicID:     strVal(row.ScenarioTopicID),
			PersonaID:   row.PersonaID,
			Title:       strVal(row.Title),
			Objective:   strVal(row.Objective),
			CEFRLevel:   enums.ScenarioDifficulty(strVal(row.CEFRLevel)),
			MaxDuration: row.MaxDuration,
			Details:     row.Details,
			UserID:      row.UserID,
			Persona:     previewPersona(row),
		})
	}
	return grouped, nil
}
