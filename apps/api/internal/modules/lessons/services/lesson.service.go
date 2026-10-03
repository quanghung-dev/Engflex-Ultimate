package services

import (
	"context"
	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/lessons/dtos/requests"
	"log/slog"
)

type LessonService interface {
	List(ctx context.Context, limit int, offset int) ([]*models.Lesson, int64, error)
	GetByID(ctx context.Context, id string) (*models.Lesson, error)
	Create(ctx context.Context, req requests.CreateLesson) (*models.Lesson, error)
	Update(ctx context.Context, id string, req requests.UpdateLesson) (*models.Lesson, error)
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int64, error)
}

type lessonService struct {
	repo repositories.LessonRepository
}

func NewLessonService(repo repositories.LessonRepository) LessonService {
	return &lessonService{repo: repo}
}

func (s *lessonService) List(ctx context.Context, limit, offset int) ([]*models.Lesson, int64, error) {
	lessons, err := s.repo.List(ctx, limit, offset)
	if err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "failed to list lessons", appErr)
		return nil, 0, appErr
	}
	total, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "failed to count lessons", appErr)
		return nil, 0, appErr
	}
	slog.InfoContext(ctx, "lessons listed", "count", len(lessons), "total", total)
	return lessons, total, nil
}

func (s *lessonService) GetByID(ctx context.Context, id string) (*models.Lesson, error) {
	lesson, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "failed to get lesson", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "lesson found", "lesson_id", lesson.ID)
	return lesson, nil
}

func (s *lessonService) Create(ctx context.Context, req requests.CreateLesson) (*models.Lesson, error) {
	lesson := &models.Lesson{
		CategoryID:   req.CategoryID,
		Title:        req.Title,
		Description:  req.Description,
		VideoURL:     req.VideoURL,
		ThumbnailURL: req.ThumbnailURL,
		Level:        req.Level,
		Duration:     req.Duration,
	}
	err := s.repo.Create(ctx, lesson)
	if err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "failed to create lesson", appErr)
		return nil, appErr
	}
	slog.InfoContext(ctx, "lesson created", "lesson_id", lesson.ID)
	return lesson, nil
}

func (s *lessonService) Update(ctx context.Context, id string, req requests.UpdateLesson) (*models.Lesson, error) {
	lesson, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "failed to get lesson for update", appErr, "id", id)
		return nil, appErr
	}
	lesson.CategoryID = req.CategoryID
	lesson.Title = req.Title
	lesson.Description = req.Description
	lesson.VideoURL = req.VideoURL
	lesson.ThumbnailURL = req.ThumbnailURL
	lesson.Level = req.Level
	lesson.Duration = req.Duration
	if err := s.repo.Update(ctx, lesson); err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "failed to update lesson", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "lesson updated", "lesson_id", lesson.ID)
	return lesson, nil
}

func (s *lessonService) Delete(ctx context.Context, id string) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "failed to delete lesson", appErr, "id", id)
		return appErr
	}
	slog.InfoContext(ctx, "lesson deleted", "id", id)
	return nil
}

func (s *lessonService) Count(ctx context.Context) (int64, error) {
	count, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "lesson")
		logger.Report(ctx, "failed to count lesson", appErr)
		return 0, appErr
	}
	slog.InfoContext(ctx, "lesson count", "count", count)
	return count, nil
}
