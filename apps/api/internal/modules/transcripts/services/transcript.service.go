package services

import (
	"context"
	"log/slog"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/transcripts/dtos/requests"
)

type TranscriptService interface {
	List(ctx context.Context, limit, offset int) ([]*models.Transcript, int64, error)
	GetByID(ctx context.Context, id string) (*models.Transcript, error)
	GetByLessonID(ctx context.Context, lessonID string) ([]*models.Transcript, error)
	Create(ctx context.Context, req requests.CreateTranscript) (*models.Transcript, error)
	Update(ctx context.Context, id string, req requests.UpdateTranscript) (*models.Transcript, error)
	Delete(ctx context.Context, id string) error
	Count(ctx context.Context) (int64, error)
}

type transcriptService struct {
	repo repositories.TranscriptRepository
}

func NewTranscriptService(repo repositories.TranscriptRepository) TranscriptService {
	return &transcriptService{repo: repo}
}

func (s *transcriptService) Create(ctx context.Context, req requests.CreateTranscript) (*models.Transcript, error) {
	transcript := &models.Transcript{
		LessonID:       req.LessonID,
		Sequence:       req.Sequence,
		Content:        req.Content,
		Phonetic:       req.Phonetic,
		Vietnamese:     req.Vietnamese,
		StartTimestamp: req.StartTimestamp,
		EndTimestamp:   req.EndTimestamp,
	}
	err := s.repo.Create(ctx, transcript)
	if err != nil {
		appErr := common.FromDBError(err, "transcript")
		logger.Report(ctx, "failed to create transcript", appErr)
		return nil, appErr
	}
	slog.InfoContext(ctx, "transcript created", "id", transcript.ID)
	return transcript, nil
}

func (s *transcriptService) Update(ctx context.Context, id string, req requests.UpdateTranscript) (*models.Transcript, error) {
	transcript, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "transcript")
		logger.Report(ctx, "failed to get transcript for update", appErr, "id", id)
		return nil, appErr
	}
	if req.Sequence != nil {
		transcript.Sequence = *req.Sequence
	}
	if req.Content != nil {
		transcript.Content = *req.Content
	}
	if req.Phonetic != nil {
		transcript.Phonetic = *req.Phonetic
	}
	if req.Vietnamese != nil {
		transcript.Vietnamese = *req.Vietnamese
	}
	if req.StartTimestamp != nil {
		transcript.StartTimestamp = *req.StartTimestamp
	}
	if req.EndTimestamp != nil {
		transcript.EndTimestamp = *req.EndTimestamp
	}
	if err = s.repo.Update(ctx, transcript); err != nil {
		appErr := common.FromDBError(err, "transcript")
		logger.Report(ctx, "failed to update transcript", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "transcript updated", "id", transcript.ID)
	return transcript, nil
}

func (s *transcriptService) Delete(ctx context.Context, id string) error {
	err := s.repo.Delete(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "transcript")
		logger.Report(ctx, "failed to delete transcript", appErr, "id", id)
		return appErr
	}
	slog.InfoContext(ctx, "transcript deleted", "id", id)
	return nil
}

func (s *transcriptService) GetByID(ctx context.Context, id string) (*models.Transcript, error) {
	transcript, err := s.repo.GetByID(ctx, id)
	if err != nil {
		appErr := common.FromDBError(err, "transcript")
		logger.Report(ctx, "failed to get transcript", appErr, "id", id)
		return nil, appErr
	}
	slog.InfoContext(ctx, "transcript found", "id", transcript.ID)
	return transcript, nil
}

func (s *transcriptService) List(ctx context.Context, limit, offset int) ([]*models.Transcript, int64, error) {
	transcripts, err := s.repo.List(ctx, limit, offset)
	if err != nil {
		appErr := common.FromDBError(err, "transcript")
		logger.Report(ctx, "failed to list transcripts", appErr)
		return nil, 0, appErr
	}
	total, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "transcript")
		logger.Report(ctx, "failed to count transcripts", appErr)
		return nil, 0, appErr
	}
	slog.InfoContext(ctx, "transcripts listed", "count", len(transcripts), "total", total)
	return transcripts, total, nil
}

func (s *transcriptService) GetByLessonID(ctx context.Context, lessonID string) ([]*models.Transcript, error) {
	transcripts, err := s.repo.GetByLessonID(ctx, lessonID)
	if err != nil {
		appErr := common.FromDBError(err, "transcript")
		logger.Report(ctx, "failed to get transcripts by lesson id", appErr, "lesson_id", lessonID)
		return nil, appErr
	}
	slog.InfoContext(ctx, "transcripts found by lesson id", "lesson_id", lessonID)
	return transcripts, nil
}

func (s *transcriptService) Count(ctx context.Context) (int64, error) {
	count, err := s.repo.Count(ctx)
	if err != nil {
		appErr := common.FromDBError(err, "transcript")
		logger.Report(ctx, "failed to count transcripts", appErr)
		return 0, appErr
	}
	slog.InfoContext(ctx, "transcripts count", "count", count)
	return count, nil
}
