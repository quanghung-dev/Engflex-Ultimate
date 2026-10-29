package repositories

import (
	"context"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"

	"gorm.io/gorm"
)

type LessonSectionRepository interface {
	List(ctx context.Context) ([]*models.LessonSection, error)
	GetByID(ctx context.Context, id string) (*models.LessonSection, error)
	ListWithUnits(ctx context.Context, level enums.CEFR) ([]*models.LessonSection, error)
	WithTx(tx *gorm.DB) LessonSectionRepository
}

type lessonSectionRepository struct {
	db *gorm.DB
}

func NewLessonSectionRepository(db *gorm.DB) LessonSectionRepository {
	return &lessonSectionRepository{db: db}
}

func (r *lessonSectionRepository) WithTx(tx *gorm.DB) LessonSectionRepository {
	return &lessonSectionRepository{db: tx}
}

func (r *lessonSectionRepository) List(ctx context.Context) ([]*models.LessonSection, error) {
	var out []*models.LessonSection
	if err := r.db.WithContext(ctx).Order("position ASC").Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *lessonSectionRepository) GetByID(ctx context.Context, id string) (*models.LessonSection, error) {
	if _, err := parseID(id, "id"); err != nil {
		return nil, err
	}
	var m models.LessonSection
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *lessonSectionRepository) ListWithUnits(ctx context.Context, level enums.CEFR) ([]*models.LessonSection, error) {
	var sections []*models.LessonSection
	if err := r.db.WithContext(ctx).Order("position ASC").Find(&sections).Error; err != nil {
		return nil, err
	}
	lq := r.db.WithContext(ctx).Model(&models.Lesson{}).Joins("Section")
	if level != "" {
		lq = lq.Where("lessons.cefr_level = ?", string(level))
	}
	var units []*models.Lesson
	if err := lq.Order("lessons.created_at ASC").Find(&units).Error; err != nil {
		return nil, err
	}
	bySection := map[string][]*models.Lesson{}
	for _, u := range units {
		bySection[u.SectionID] = append(bySection[u.SectionID], u)
	}
	out := make([]*models.LessonSection, 0, len(sections))
	for _, s := range sections {
		s.Units = bySection[s.ID]
		if len(s.Units) == 0 {
			continue
		}
		out = append(out, s)
	}
	return out, nil
}
