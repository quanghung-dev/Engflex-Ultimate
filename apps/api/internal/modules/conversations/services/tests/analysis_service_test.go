package tests

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	repomocks "engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/conversations/services"
	svcmocks "engflex-api/internal/modules/conversations/services/mocks"
)

const turnID = "33333333-3333-3333-3333-333333333333"

func userTurn() *models.ConversationTurn {
	return &models.ConversationTurn{
		ID: turnID, ConversationID: convID, Position: 1,
		Role: enums.TurnRoleUser, Text: "I go yesterday.",
	}
}

func newAnalysisService(t *testing.T) (*services.ConversationService, *repomocks.MockConversationRepository, *svcmocks.MockVoiceClient, *repomocks.MockFeedbackRepository) {
	t.Helper()
	repo := repomocks.NewMockConversationRepository(t)
	feedback := repomocks.NewMockFeedbackRepository(t)
	voice := svcmocks.NewMockVoiceClient(t)
	return services.NewConversationService(repo, voice, 300, feedback, repomocks.NewMockScenarioRepository(t), repomocks.NewMockPersonaRepository(t)), repo, voice, feedback
}

const goodFeedback = `{"annotated":"I went yesterday.","marks":[],"upgrades":[],"tip":"past tense"}`

func TestAnalyzeTurn(t *testing.T) {
	tests := []struct {
		name       string
		setup      func(*repomocks.MockConversationRepository, *svcmocks.MockVoiceClient, *repomocks.MockFeedbackRepository)
		wantStatus int
		check      func(*testing.T, *models.Feedback)
	}{
		{
			name: "upserts feedback for the turn",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient, fb *repomocks.MockFeedbackRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: userID}, nil)
				repo.On("GetTurnByPosition", mock.Anything, convID, 1).Return(userTurn(), nil)
				repo.On("ListTurns", mock.Anything, convID).Return([]*models.ConversationTurn{userTurn()}, nil)
				voice.On("AnalyzeTurn", mock.Anything, mock.MatchedBy(
					func(req services.AnalyzeTurnRequest) bool {
						return req.Text == "I go yesterday." && req.TurnID == turnID
					})).Return(&services.AnalyzeTurnResponse{Feedback: json.RawMessage(goodFeedback)}, nil)
				fb.On("Upsert", mock.Anything, mock.Anything).Return(nil)
			},
			check: func(t *testing.T, f *models.Feedback) {
				assert.Equal(t, enums.FeedbackSubjectConversationTurn, f.SubjectType)
				assert.Equal(t, turnID, f.SubjectID)
				assert.Equal(t, userID, f.UserID)
				assert.JSONEq(t, goodFeedback, string(f.Payload))
			},
		},
		{
			name: "rejects a bot turn",
			setup: func(repo *repomocks.MockConversationRepository, _ *svcmocks.MockVoiceClient, _ *repomocks.MockFeedbackRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: userID}, nil)
				repo.On("GetTurnByPosition", mock.Anything, convID, 1).Return(&models.ConversationTurn{
					ID: turnID, ConversationID: convID, Role: enums.TurnRoleAI, Text: "hi",
				}, nil)
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "unknown position is 404",
			setup: func(repo *repomocks.MockConversationRepository, _ *svcmocks.MockVoiceClient, _ *repomocks.MockFeedbackRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: userID}, nil)
				repo.On("GetTurnByPosition", mock.Anything, convID, 1).
					Return(nil, gorm.ErrRecordNotFound)
			},
			wantStatus: http.StatusNotFound,
		},
		{
			name: "engine failure persists nothing",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient, _ *repomocks.MockFeedbackRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: userID}, nil)
				repo.On("GetTurnByPosition", mock.Anything, convID, 1).Return(userTurn(), nil)
				repo.On("ListTurns", mock.Anything, convID).Return([]*models.ConversationTurn{userTurn()}, nil)
				voice.On("AnalyzeTurn", mock.Anything, mock.Anything).
					Return(nil, errors.New("engine 500"))
			},
			wantStatus: http.StatusServiceUnavailable,
		},
		{
			name: "empty engine feedback persists nothing",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient, _ *repomocks.MockFeedbackRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: userID}, nil)
				repo.On("GetTurnByPosition", mock.Anything, convID, 1).Return(userTurn(), nil)
				repo.On("ListTurns", mock.Anything, convID).Return([]*models.ConversationTurn{userTurn()}, nil)
				voice.On("AnalyzeTurn", mock.Anything, mock.Anything).
					Return(&services.AnalyzeTurnResponse{Feedback: json.RawMessage("")}, nil)
			},
			wantStatus: http.StatusServiceUnavailable,
		},
		{
			name: "non-object feedback persists nothing",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient, _ *repomocks.MockFeedbackRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: userID}, nil)
				repo.On("GetTurnByPosition", mock.Anything, convID, 1).Return(userTurn(), nil)
				repo.On("ListTurns", mock.Anything, convID).Return([]*models.ConversationTurn{userTurn()}, nil)
				voice.On("AnalyzeTurn", mock.Anything, mock.Anything).
					Return(&services.AnalyzeTurnResponse{Feedback: json.RawMessage(`[1,2,3]`)}, nil)
			},
			wantStatus: http.StatusServiceUnavailable,
		},
		{
			name: "wrong-shape feedback persists nothing",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient, _ *repomocks.MockFeedbackRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: userID}, nil)
				repo.On("GetTurnByPosition", mock.Anything, convID, 1).Return(userTurn(), nil)
				repo.On("ListTurns", mock.Anything, convID).Return([]*models.ConversationTurn{userTurn()}, nil)
				// The engine's pydantic validation should have caught this, but
				// Go is the last gate before the database.
				voice.On("AnalyzeTurn", mock.Anything, mock.Anything).
					Return(&services.AnalyzeTurnResponse{
						Feedback: json.RawMessage(`{"annotated":"a","tip":"t"}`),
					}, nil)
			},
			wantStatus: http.StatusServiceUnavailable,
		},
		{
			name: "foreign conversation is 404",
			setup: func(repo *repomocks.MockConversationRepository, _ *svcmocks.MockVoiceClient, _ *repomocks.MockFeedbackRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: "someone_else"}, nil)
			},
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, repo, voice, fb := newAnalysisService(t)
			tt.setup(repo, voice, fb)

			stored, err := svc.AnalyzeTurn(context.Background(), userID, convID, 1)

			if tt.wantStatus != 0 {
				requireAppError(t, err, tt.wantStatus)
				assert.Nil(t, stored)
				return
			}
			require.NoError(t, err)
			tt.check(t, stored)
		})
	}
}

func TestAnalyze_SendsUpToFiveContextTurns(t *testing.T) {
	svc, repo, voice, fb := newAnalysisService(t)
	turns := []*models.ConversationTurn{}
	for i := 1; i <= 8; i++ {
		turns = append(turns, &models.ConversationTurn{
			ID:       "44444444-4444-4444-4444-44444444444" + string(rune('0'+i)),
			Text:     "prior",
			Role:     enums.TurnRoleAI,
			Position: i,
		})
	}
	target := userTurn()
	target.Position = 9
	turns = append(turns, target)
	repo.On("GetByID", mock.Anything, convID).
		Return(&models.Conversation{ID: convID, UserID: userID}, nil)
	repo.On("GetTurnByPosition", mock.Anything, convID, 1).Return(userTurn(), nil)
	repo.On("ListTurns", mock.Anything, convID).Return(turns, nil)
	voice.On("AnalyzeTurn", mock.Anything, mock.MatchedBy(
		func(req services.AnalyzeTurnRequest) bool { return len(req.Context) == 5 },
	)).Return(&services.AnalyzeTurnResponse{Feedback: json.RawMessage(goodFeedback)}, nil)
	fb.On("Upsert", mock.Anything, mock.Anything).Return(nil)

	_, err := svc.AnalyzeTurn(context.Background(), userID, convID, 1)
	require.NoError(t, err)
}

func TestAnalyze_RequestCarriesNoLevelOrObjective(t *testing.T) {
	svc, repo, _, _ := newAnalysisService(t)
	// BuildAnalyzeRequest performs no ownership check (AnalyzeTurn does that
	// first), so GetByID is deliberately unmocked here.
	repo.On("GetTurnByPosition", mock.Anything, convID, 1).Return(userTurn(), nil)
	repo.On("ListTurns", mock.Anything, convID).Return([]*models.ConversationTurn{userTurn()}, nil)
	// BuildAnalyzeRequest stops before the engine call: voice and Upsert are
	// deliberately unmocked, so any call to them would fail the test.

	req, err := svc.BuildAnalyzeRequest(context.Background(), convID, 1)
	require.NoError(t, err)
	raw, err := json.Marshal(req)
	require.NoError(t, err)
	assert.NotContains(t, string(raw), "cefr")
	assert.NotContains(t, string(raw), "objective")
}

func TestGetWithFeedback_AttachesFeedbackToTurns(t *testing.T) {
	svc, repo, _, fb := newAnalysisService(t)
	repo.On("GetByID", mock.Anything, convID).
		Return(&models.Conversation{ID: convID, UserID: userID}, nil)
	repo.On("ListTurns", mock.Anything, convID).Return([]*models.ConversationTurn{userTurn()}, nil)
	fb.On("ListForSubjects", mock.Anything, userID,
		string(enums.FeedbackSubjectConversationTurn), []string{turnID}).
		Return([]*models.Feedback{{
			SubjectID: turnID, Payload: []byte(goodFeedback),
		}}, nil)

	_, turns, feedbacks, err := svc.GetWithFeedback(context.Background(), userID, convID)
	require.NoError(t, err)
	require.Len(t, turns, 1)
	require.Len(t, feedbacks, 1)
	assert.Equal(t, turnID, feedbacks[0].SubjectID)
}
