package tests

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	repomocks "engflex-api/internal/database/repositories/mocks"
	dtoscallbacks "engflex-api/internal/modules/conversations/dtos/callbacks"
)

func oneUserTurn() dtoscallbacks.IngestTurns {
	return dtoscallbacks.IngestTurns{
		Turns: []dtoscallbacks.IngestTurn{{
			Position: 1,
			Role:     enums.TurnRoleUser,
			Text:     "hello",
		}},
	}
}

func TestIngestTurns(t *testing.T) {
	tests := []struct {
		name       string
		req        dtoscallbacks.IngestTurns
		setup      func(*repomocks.MockConversationRepository, *repomocks.MockConversationTurnRepository)
		wantStored int
		wantStatus int
	}{
		{
			name: "user turn is stored",
			req:  oneUserTurn(),
			setup: func(repo *repomocks.MockConversationRepository, turns *repomocks.MockConversationTurnRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: userID}, nil).Once()
				turns.On("UpsertTurns", mock.Anything, convID, mock.Anything).
					Run(func(args mock.Arguments) {
						turns := args.Get(2).([]*models.ConversationTurn)
						assert.Equal(t, "hello", turns[0].Text)
						assert.Equal(t, enums.TurnRoleUser, turns[0].Role)
					}).
					Return(1, nil).Once()
			},
			wantStored: 1,
		},
		{
			name: "interruption flag is carried through",
			req: dtoscallbacks.IngestTurns{Turns: []dtoscallbacks.IngestTurn{{
				Position: 3, Role: enums.TurnRoleUser, Text: "wait, no",
				WasInterrupted: true,
			}}},
			setup: func(repo *repomocks.MockConversationRepository, turns *repomocks.MockConversationTurnRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(&models.Conversation{ID: convID, UserID: userID}, nil).Once()
				turns.On("UpsertTurns", mock.Anything, convID, mock.Anything).
					Run(func(args mock.Arguments) {
						turns := args.Get(2).([]*models.ConversationTurn)
						assert.True(t, turns[0].WasInterrupted)
					}).
					Return(1, nil).Once()
			},
			wantStored: 1,
		},
		{
			name:       "batch over the cap is rejected",
			req:        dtoscallbacks.IngestTurns{Turns: manyTurns(501)},
			setup:      func(*repomocks.MockConversationRepository, *repomocks.MockConversationTurnRepository) {},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "unknown conversation is 404",
			req:  oneUserTurn(),
			setup: func(repo *repomocks.MockConversationRepository, turns *repomocks.MockConversationTurnRepository) {
				repo.On("GetByID", mock.Anything, convID).
					Return(nil, gorm.ErrRecordNotFound).Once()
			},
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "empty batch is 400",
			req:        dtoscallbacks.IngestTurns{Turns: nil},
			setup:      func(*repomocks.MockConversationRepository, *repomocks.MockConversationTurnRepository) {},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, repo, turns, _, _ := newService(t)
			tt.setup(repo, turns)

			got, err := svc.IngestTurns(context.Background(), convID, tt.req)

			if tt.wantStatus != 0 {
				requireAppError(t, err, tt.wantStatus)
				assert.Equal(t, 0, got)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.wantStored, got)
		})
	}
}

// manyTurns builds n minimal turns for the batch-cap assertion.
func manyTurns(n int) []dtoscallbacks.IngestTurn {
	out := make([]dtoscallbacks.IngestTurn, 0, n)
	for i := 1; i <= n; i++ {
		out = append(out, dtoscallbacks.IngestTurn{
			Position: i, Role: enums.TurnRoleUser, Text: "t",
		})
	}
	return out
}

func TestIngestTurns_DuplicateBatchCreatesNoDuplicates(t *testing.T) {
	svc, repo, turns, _, _ := newService(t)
	repo.On("GetByID", mock.Anything, convID).
		Return(&models.Conversation{ID: convID, UserID: userID}, nil).Twice()
	// The repository's ON CONFLICT DO NOTHING reports zero new rows on replay.
	turns.On("UpsertTurns", mock.Anything, convID, mock.Anything).Return(1, nil).Once()
	turns.On("UpsertTurns", mock.Anything, convID, mock.Anything).Return(0, nil).Once()

	first, err := svc.IngestTurns(context.Background(), convID, oneUserTurn())
	require.NoError(t, err)
	assert.Equal(t, 1, first)

	second, err := svc.IngestTurns(context.Background(), convID, oneUserTurn())
	require.NoError(t, err)
	assert.Equal(t, 0, second, "replayed batch must not create new turns")
}
