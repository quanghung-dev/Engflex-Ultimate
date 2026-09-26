package tests

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	repomocks "engflex-api/internal/database/repositories/mocks"
	prequests "engflex-api/internal/modules/personas/dtos/requests"
	"engflex-api/internal/modules/scenarios/dtos/requests"
	"engflex-api/internal/modules/scenarios/services"
)

type boomErr struct{}

func (boomErr) Error() string { return "boom" }

func requireAppError(t *testing.T, err error, status int) {
	t.Helper()
	var appErr *common.AppError
	require.ErrorAs(t, err, &appErr)
	require.Equal(t, status, appErr.Status)
}

func TestScenarioList(t *testing.T) {
	topicID := "99999999-9999-9999-9999-999999999999"
	tests := []struct {
		name      string
		req       requests.ListScenarios
		setup     func(*repomocks.MockScenarioRepository)
		wantItems int
		wantTotal int64
		wantErr   int
	}{
		{
			name: "returns built-in scenarios",
			req:  requests.ListScenarios{ListParams: common.ListParams{Page: 1, PageSize: 20}},
			setup: func(repo *repomocks.MockScenarioRepository) {
				repo.On("List", mock.Anything, (*string)(nil), 20, 0).Return([]*models.Scenario{{ID: "a"}}, nil).Once()
				repo.On("Count", mock.Anything, (*string)(nil)).Return(int64(1), nil).Once()
			},
			wantItems: 1,
			wantTotal: 1,
		},
		{
			name: "topic filter is passed through",
			req: requests.ListScenarios{
				ListParams: common.ListParams{Page: 1, PageSize: 20},
				TopicID:    &topicID,
			},
			setup: func(repo *repomocks.MockScenarioRepository) {
				repo.On("List", mock.Anything, &topicID, 20, 0).Return([]*models.Scenario{}, nil).Once()
				repo.On("Count", mock.Anything, &topicID).Return(int64(0), nil).Once()
			},
			wantTotal: 0,
		},
		{
			name: "custom scenarios of one user only",
			req: requests.ListScenarios{
				ListParams: common.ListParams{Page: 2, PageSize: 10},
				Scope:      "custom",
			},
			setup: func(repo *repomocks.MockScenarioRepository) {
				repo.On("ListForUser", mock.Anything, "user_1", 10, 10).Return([]*models.Scenario{}, nil).Once()
				repo.On("CountForUser", mock.Anything, "user_1").Return(int64(0), nil).Once()
			},
			wantTotal: 0,
		},
		{
			name: "list failure maps to 500",
			req:  requests.ListScenarios{ListParams: common.ListParams{Page: 1, PageSize: 20}},
			setup: func(repo *repomocks.MockScenarioRepository) {
				repo.On("List", mock.Anything, (*string)(nil), 20, 0).Return(nil, boomErr{}).Once()
			},
			wantErr: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := repomocks.NewMockScenarioRepository(t)
			tt.setup(repo)
			svc := services.NewScenarioService(repo)

			items, total, err := svc.List(context.Background(), "user_1", tt.req)

			if tt.wantErr != 0 {
				requireAppError(t, err, tt.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Len(t, items, tt.wantItems)
			assert.Equal(t, tt.wantTotal, total)
		})
	}
}

func TestScenarioCreate(t *testing.T) {
	t.Run("custom scenario files under the seeded custom topic", func(t *testing.T) {
		repo := repomocks.NewMockScenarioRepository(t)
		repo.On("GetTopicBySlug", mock.Anything, "custom").
			Return(&models.ScenarioTopic{ID: "t-custom", Slug: "custom"}, nil).Once()
		repo.On("Create", mock.Anything, mock.MatchedBy(func(m *models.Scenario) bool {
			return m.UserID != nil && *m.UserID == "user_1" &&
				m.TopicID == "t-custom" &&
				m.Title == "My review" &&
				m.CEFRLevel == "B2"
		})).Return(nil).Once()
		svc := services.NewScenarioService(repo)

		got, err := svc.Create(context.Background(), "user_1", prequests.CreateCustomScenario{
			Title: "My review", Objective: "defend", Difficulty: enums.ScenarioDifficultyB2,
			DurationMin: 5, DurationMax: 10,
		})
		require.NoError(t, err)
		assert.Equal(t, "t-custom", got.TopicID)
	})
}
