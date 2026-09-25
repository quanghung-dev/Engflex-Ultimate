package tests

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	repomocks "engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/conversations/dtos/requests"
	"engflex-api/internal/modules/conversations/dtos/responses"
	"engflex-api/internal/modules/conversations/services"
	svcmocks "engflex-api/internal/modules/conversations/services/mocks"
)

const (
	userID = "user_1"
	convID = "11111111-1111-1111-1111-111111111111"
)

func requireAppError(t *testing.T, err error, status int) {
	t.Helper()
	var appErr *common.AppError
	require.ErrorAs(t, err, &appErr)
	require.Equal(t, status, appErr.Status)
}

func newService(t *testing.T) (*services.ConversationService, *repomocks.MockConversationRepository, *svcmocks.MockVoiceClient) {
	t.Helper()
	repo := repomocks.NewMockConversationRepository(t)
	voice := svcmocks.NewMockVoiceClient(t)
	return services.NewConversationService(repo, voice, 300), repo, voice
}

func pendingConv() *models.Conversation {
	return &models.Conversation{ID: convID, UserID: userID, Status: enums.ConversationStatusPending}
}

func TestCreate(t *testing.T) {
	scenarioID := "22222222-2222-2222-2222-222222222222"

	tests := []struct {
		name       string
		req        requests.StartConversation
		setup      func(*repomocks.MockConversationRepository)
		wantStatus int
	}{
		{
			name:       "roleplay without scenario",
			req:        requests.StartConversation{Mode: enums.ConversationModeRoleplay},
			setup:      func(*repomocks.MockConversationRepository) {},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "free talk atomically closes active rows and creates",
			req:  requests.StartConversation{Mode: enums.ConversationModeFreeTalk},
			setup: func(repo *repomocks.MockConversationRepository) {
				repo.On("CreateClosingActive", mock.Anything, mock.MatchedBy(func(m *models.Conversation) bool {
					return m.UserID == userID && m.Status == enums.ConversationStatusPending
				})).Return(nil).Once()
			},
			wantStatus: 0,
		},
		{
			name: "roleplay with scenario succeeds",
			req:  requests.StartConversation{Mode: enums.ConversationModeRoleplay, ScenarioID: &scenarioID},
			setup: func(repo *repomocks.MockConversationRepository) {
				repo.On("CreateClosingActive", mock.Anything, mock.MatchedBy(func(m *models.Conversation) bool {
					return m.ScenarioID != nil && *m.ScenarioID == scenarioID
				})).Return(nil).Once()
			},
			wantStatus: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, repo, _ := newService(t)
			tt.setup(repo)

			m, err := svc.Create(context.Background(), userID, tt.req)
			if tt.wantStatus != 0 {
				requireAppError(t, err, tt.wantStatus)
				return
			}
			require.NoError(t, err)
			require.NotNil(t, m)
		})
	}
}

func TestGetOwnership(t *testing.T) {
	tests := []struct {
		name       string
		conv       *models.Conversation
		dbErr      error
		wantStatus int
	}{
		{name: "not found", dbErr: errNotFound(), wantStatus: http.StatusNotFound},
		{name: "other user", conv: &models.Conversation{ID: convID, UserID: "someone_else", Status: enums.ConversationStatusPending}, wantStatus: http.StatusNotFound},
		{name: "owner", conv: pendingConv(), wantStatus: 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, repo, _ := newService(t)
			repo.On("GetByID", mock.Anything, convID).Return(tt.conv, tt.dbErr).Once()

			m, err := svc.Get(context.Background(), userID, convID)
			if tt.wantStatus != 0 {
				requireAppError(t, err, tt.wantStatus)
				return
			}
			require.NoError(t, err)
			require.Equal(t, convID, m.ID)
		})
	}
}

func TestStart(t *testing.T) {
	tests := []struct {
		name       string
		setup      func(*repomocks.MockConversationRepository, *svcmocks.MockVoiceClient)
		wantStatus int
	}{
		{
			name: "cached response skips the engine",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient) {
				raw, _ := json.Marshal(services.StartResponse{
					SessionID: "eng-1",
					ICEConfig: &responses.IceConfig{IceServers: []responses.IceServer{{URLs: []string{"stun:x"}}}},
				})
				repo.On("GetByID", mock.Anything, convID).Return(&models.Conversation{
					ID: convID, UserID: userID, Status: enums.ConversationStatusPending,
					SpeechSessionID: "eng-1", SpeechStartResponse: raw,
				}, nil).Once()
			},
		},
		{
			name: "fresh start caches the engine response",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient) {
				repo.On("GetByID", mock.Anything, convID).Return(pendingConv(), nil).Once()
				voice.On("Start", mock.Anything, mock.AnythingOfType("services.StartRequest")).
					Return(&services.StartResponse{SessionID: "eng-2"}, nil).Once()
				repo.On("SetSpeechStart", mock.Anything, convID, "eng-2", mock.Anything).Return(int64(1), nil).Once()
			},
		},
		{
			name: "engine failure is not cached and surfaces 503",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient) {
				repo.On("GetByID", mock.Anything, convID).Return(pendingConv(), nil).Once()
				voice.On("Start", mock.Anything, mock.AnythingOfType("services.StartRequest")).
					Return(nil, errBoom()).Once()
			},
			wantStatus: http.StatusServiceUnavailable,
		},
		{
			name: "live conversation conflicts",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient) {
				repo.On("GetByID", mock.Anything, convID).Return(&models.Conversation{
					ID: convID, UserID: userID, Status: enums.ConversationStatusLive,
				}, nil).Once()
			},
			wantStatus: http.StatusConflict,
		},
		{
			name: "corrupt cache falls through to the engine",
			setup: func(repo *repomocks.MockConversationRepository, voice *svcmocks.MockVoiceClient) {
				repo.On("GetByID", mock.Anything, convID).Return(&models.Conversation{
					ID: convID, UserID: userID, Status: enums.ConversationStatusPending,
					SpeechSessionID: "eng-9", SpeechStartResponse: []byte(`{}`),
				}, nil).Once()
				voice.On("Start", mock.Anything, mock.AnythingOfType("services.StartRequest")).
					Return(&services.StartResponse{SessionID: "eng-9"}, nil).Once()
				repo.On("SetSpeechStart", mock.Anything, convID, "eng-9", mock.Anything).Return(int64(1), nil).Once()
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, repo, voice := newService(t)
			tt.setup(repo, voice)

			_, _, err := svc.Start(context.Background(), userID, convID)
			if tt.wantStatus != 0 {
				requireAppError(t, err, tt.wantStatus)
				return
			}
			require.NoError(t, err)
		})
	}
}

func TestOfferTransitions(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		engineBody []byte
		engineCode int
		engineErr  error
		setupRepo  func(*repomocks.MockConversationRepository)
		wantStatus int
		wantHTTP   int
	}{
		{
			name:       "post 2xx marks live",
			method:     http.MethodPost,
			engineBody: []byte(`{"sdp":"answer"}`),
			engineCode: http.StatusOK,
			setupRepo: func(repo *repomocks.MockConversationRepository) {
				repo.On("SetStatus", mock.Anything, convID, enums.ConversationStatusPending, enums.ConversationStatusLive).Return(int64(1), nil).Once()
			},
			wantHTTP: http.StatusOK,
		},
		{
			name:       "post 2xx empty answer marks failed",
			method:     http.MethodPost,
			engineBody: []byte(""),
			engineCode: http.StatusOK,
			setupRepo: func(repo *repomocks.MockConversationRepository) {
				repo.On("SetStatus", mock.Anything, convID, enums.ConversationStatusPending, enums.ConversationStatusFailed).Return(int64(1), nil).Once()
			},
			wantStatus: http.StatusServiceUnavailable,
		},
		{
			name:       "patch does not change state",
			method:     http.MethodPatch,
			engineBody: []byte(`{"status":"success"}`),
			engineCode: http.StatusOK,
			setupRepo:  func(*repomocks.MockConversationRepository) {},
			wantHTTP:   http.StatusOK,
		},
		{
			name:       "post 2xx with failing transition surfaces 500",
			method:     http.MethodPost,
			engineBody: []byte(`{"sdp":"answer"}`),
			engineCode: http.StatusOK,
			setupRepo: func(repo *repomocks.MockConversationRepository) {
				repo.On("SetStatus", mock.Anything, convID, enums.ConversationStatusPending, enums.ConversationStatusLive).Return(int64(0), errBoom()).Once()
			},
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, repo, voice := newService(t)
			repo.On("GetByID", mock.Anything, convID).Return(&models.Conversation{
				ID: convID, UserID: userID, Status: enums.ConversationStatusPending, SpeechSessionID: "eng-1",
			}, nil).Once()
			tt.setupRepo(repo)
			voice.On("Offer", mock.Anything, "eng-1", tt.method, mock.Anything).
				Return(tt.engineBody, tt.engineCode, tt.engineErr).Once()

			body, status, err := svc.Offer(context.Background(), userID, convID, tt.method, []byte(`{}`))
			if tt.wantStatus != 0 {
				requireAppError(t, err, tt.wantStatus)
				return
			}
			require.NoError(t, err)
			require.Equal(t, tt.wantHTTP, status)
			require.NotNil(t, body)
		})
	}
}

func TestEnd(t *testing.T) {
	tests := []struct {
		name       string
		conv       *models.Conversation
		dbErr      error
		setEnded   bool
		wantStatus int
	}{
		{
			name:     "live conversation ends",
			conv:     &models.Conversation{ID: convID, UserID: userID, Status: enums.ConversationStatusLive},
			setEnded: true,
		},
		{
			name:     "already ended is idempotent",
			conv:     &models.Conversation{ID: convID, UserID: userID, Status: enums.ConversationStatusEnded},
			setEnded: true,
		},
		{
			name:       "other user is not found",
			conv:       &models.Conversation{ID: convID, UserID: "someone_else", Status: enums.ConversationStatusLive},
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "missing conversation is not found",
			dbErr:      errNotFound(),
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, repo, _ := newService(t)
			repo.On("GetByID", mock.Anything, convID).Return(tt.conv, tt.dbErr).Once()
			if tt.setEnded {
				repo.On("SetEnded", mock.Anything, convID, (*int)(nil)).Return(int64(1), nil).Once()
				ended := &models.Conversation{ID: convID, UserID: userID, Status: enums.ConversationStatusEnded}
				repo.On("GetByID", mock.Anything, convID).Return(ended, nil).Once()
			}

			m, err := svc.End(context.Background(), userID, convID)
			if tt.wantStatus != 0 {
				requireAppError(t, err, tt.wantStatus)
				return
			}
			require.NoError(t, err)
			require.Equal(t, enums.ConversationStatusEnded, m.Status)
		})
	}
}

func TestFinalize(t *testing.T) {
	tests := []struct {
		name       string
		status     enums.ConversationStatus
		duration   int
		wantStatus int
	}{
		{name: "live conversation records duration", status: enums.ConversationStatusLive, duration: 120},
		{name: "finalize after end keeps duration", status: enums.ConversationStatusEnded, duration: 42},
		{name: "negative duration is rejected", status: enums.ConversationStatusLive, duration: -1, wantStatus: http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, repo, _ := newService(t)
			if tt.wantStatus == 0 {
				repo.On("GetByID", mock.Anything, convID).Return(&models.Conversation{
					ID: convID, UserID: userID, Status: tt.status,
				}, nil).Once()
				repo.On("SetEnded", mock.Anything, convID, mock.MatchedBy(func(d *int) bool {
					return d != nil && *d == tt.duration
				})).Return(int64(1), nil).Once()
			}

			err := svc.Finalize(context.Background(), convID, tt.duration)
			if tt.wantStatus != 0 {
				requireAppError(t, err, tt.wantStatus)
				return
			}
			require.NoError(t, err)
		})
	}
}

func errNotFound() error { return gorm.ErrRecordNotFound }
func errBoom() error     { return errors.New("boom") }
