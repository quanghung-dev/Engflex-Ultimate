package services

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories"
	"engflex-api/internal/logger"
	"engflex-api/internal/modules/videos/dtos/requests"
	"engflex-api/internal/modules/videos/dtos/responses"
)

type VideoAttemptService interface {
	StartAttempt(ctx context.Context, userID, videoExerciseID string, attemptType enums.AttemptType, req requests.StartVideoAttempt) (*models.Attempt, error)
	GetOpenAttempt(ctx context.Context, userID, videoExerciseID string, attemptType enums.AttemptType) (*models.Attempt, error)
	SaveProgress(ctx context.Context, userID, videoExerciseID, attemptID string, req requests.SaveVideoProgress) (*models.Attempt, error)
	CompleteAttempt(ctx context.Context, userID, videoExerciseID, attemptID string, req requests.CompleteVideoAttempt) (*models.Attempt, error)
	AttachPracticeStatus(ctx context.Context, userID string, videos []*responses.VideoExerciseResponse) error
}

type videoAttemptService struct {
	attempts  repositories.AttemptRepository
	exercises repositories.VideoExerciseRepository
}

func NewVideoAttemptService(attempts repositories.AttemptRepository, exercises repositories.VideoExerciseRepository) VideoAttemptService {
	return &videoAttemptService{attempts: attempts, exercises: exercises}
}

func (s *videoAttemptService) StartAttempt(ctx context.Context, userID, videoExerciseID string, attemptType enums.AttemptType, req requests.StartVideoAttempt) (*models.Attempt, error) {
	if _, err := uuid.Parse(videoExerciseID); err != nil {
		return nil, common.BadRequest("invalid video exercise id")
	}
	if _, err := s.exercises.GetByID(ctx, videoExerciseID); err != nil {
		appErr := common.FromDBError(err, "video exercise")
		logger.Report(ctx, "find video exercise failed", appErr, "videoExerciseID", videoExerciseID)
		return nil, appErr
	}
	if attemptType != enums.AttemptTypeDictation && attemptType != enums.AttemptTypeShadowing {
		return nil, common.BadRequest("invalid video practice type")
	}

	if open, err := s.attempts.GetVideoAttempt(ctx, userID, videoExerciseID, attemptType); err == nil {
		slog.InfoContext(ctx, "open video attempt reused", "attemptID", open.ID, "type", attemptType)
		return open, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		appErr := common.FromDBError(err, "attempt")
		logger.Report(ctx, "find open video attempt failed", appErr, "videoExerciseID", videoExerciseID)
		return nil, appErr
	}

	m := &models.Attempt{
		UserID:          userID,
		VideoExerciseID: &videoExerciseID,
		Type:            attemptType,
		Status:          enums.AttemptStatusInProgress,
		Result:          []byte(`{}`),
	}
	if err := s.attempts.Create(ctx, m); err != nil {
		appErr := common.FromDBError(err, "attempt")
		logger.Report(ctx, "start video attempt failed", appErr, "videoExerciseID", videoExerciseID)
		return nil, appErr
	}
	slog.InfoContext(ctx, "video attempt started", "attemptID", m.ID, "type", attemptType)
	return m, nil
}

func (s *videoAttemptService) GetOpenAttempt(ctx context.Context, userID, videoExerciseID string, attemptType enums.AttemptType) (*models.Attempt, error) {
	if _, err := uuid.Parse(videoExerciseID); err != nil {
		return nil, common.BadRequest("invalid video exercise id")
	}
	if attemptType != enums.AttemptTypeDictation && attemptType != enums.AttemptTypeShadowing {
		return nil, common.BadRequest("invalid video practice type")
	}
	m, err := s.attempts.GetVideoAttempt(ctx, userID, videoExerciseID, attemptType)
	if err != nil {
		appErr := common.FromDBError(err, "attempt")
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Report(ctx, "find open video attempt failed", appErr, "videoExerciseID", videoExerciseID)
		}
		return nil, appErr
	}
	slog.InfoContext(ctx, "open video attempt loaded", "attemptID", m.ID, "type", attemptType)
	return m, nil
}

func (s *videoAttemptService) loadOwnedAttempt(ctx context.Context, userID, attemptID string) (*models.Attempt, error) {
	if _, err := uuid.Parse(attemptID); err != nil {
		return nil, common.BadRequest("invalid attempt id")
	}
	m, err := s.attempts.GetByID(ctx, attemptID)
	if err != nil {
		appErr := common.FromDBError(err, "attempt")
		logger.Report(ctx, "load owned attempt failed", appErr, "attemptID", attemptID)
		return nil, appErr
	}
	if m.UserID != userID {
		return nil, common.NotFound("attempt not found")
	}
	if m.Status != enums.AttemptStatusInProgress {
		return nil, common.Conflict("attempt is closed")
	}
	return m, nil
}

func (s *videoAttemptService) SaveProgress(ctx context.Context, userID, videoExerciseID, attemptID string, req requests.SaveVideoProgress) (*models.Attempt, error) {
	m, err := s.loadOwnedAttempt(ctx, userID, attemptID)
	if err != nil {
		return nil, err
	}
	if m.VideoExerciseID == nil || *m.VideoExerciseID != videoExerciseID {
		return nil, common.BadRequest("attempt does not belong to this video exercise")
	}

	encoded, err := json.Marshal(req)
	if err != nil {
		logger.Report(ctx, "encode video progress failed", common.Internal(), "attemptID", m.ID)
		return nil, common.Internal()
	}
	m.Result = encoded
	if err := s.attempts.Update(ctx, m); err != nil {
		appErr := common.FromDBError(err, "attempt")
		logger.Report(ctx, "save video progress failed", appErr, "attemptID", m.ID)
		return nil, appErr
	}
	slog.InfoContext(ctx, "video progress saved", "attemptID", m.ID)
	return m, nil
}

func (s *videoAttemptService) CompleteAttempt(ctx context.Context, userID, videoExerciseID, attemptID string, req requests.CompleteVideoAttempt) (*models.Attempt, error) {
	m, err := s.loadOwnedAttempt(ctx, userID, attemptID)
	if err != nil {
		return nil, err
	}
	if m.VideoExerciseID == nil || *m.VideoExerciseID != videoExerciseID {
		return nil, common.BadRequest("attempt does not belong to this video exercise")
	}

	m.Status = enums.AttemptStatusCompleted
	m.Score = req.Score
	m.DurationSec = req.DurationSec
	if err := s.attempts.Update(ctx, m); err != nil {
		appErr := common.FromDBError(err, "attempt")
		logger.Report(ctx, "complete video attempt failed", appErr, "attemptID", m.ID)
		return nil, appErr
	}
	slog.InfoContext(ctx, "video attempt completed", "attemptID", m.ID, "score", m.Score)
	return m, nil
}

func (s *videoAttemptService) AttachPracticeStatus(ctx context.Context, userID string, videos []*responses.VideoExerciseResponse) error {
	if len(videos) == 0 || userID == "" {
		return nil
	}
	ids := make([]string, len(videos))
	for i, v := range videos {
		ids[i] = v.ID
	}
	attempts, err := s.attempts.ListCompletedVideo(ctx, userID, ids)
	if err != nil {
		appErr := common.FromDBError(err, "attempt")
		logger.Report(ctx, "list completed video attempts failed", appErr, "userID", userID)
		return appErr
	}

	doneMap := make(map[string]map[enums.AttemptType]bool)
	for _, a := range attempts {
		if a.VideoExerciseID == nil {
			continue
		}
		vid := *a.VideoExerciseID
		if doneMap[vid] == nil {
			doneMap[vid] = make(map[enums.AttemptType]bool)
		}
		doneMap[vid][a.Type] = true
	}

	for _, v := range videos {
		dm := doneMap[v.ID]
		v.Practice = &responses.VideoPracticeStatus{
			Dictation: dm[enums.AttemptTypeDictation],
			Shadowing: dm[enums.AttemptTypeShadowing],
		}
	}
	return nil
}
