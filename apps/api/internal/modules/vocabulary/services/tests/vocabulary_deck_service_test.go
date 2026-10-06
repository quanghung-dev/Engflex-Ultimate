package tests

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories/mocks"
)

func TestVocabularyDeckService_GetDetail(t *testing.T) {
	deckID := "11111111-1111-1111-1111-111111111111"
	owner := "user_1"
	graph := &models.VocabularyDeck{
		ID: deckID, Name: "Core", UserID: &owner,
		Category: &models.VocabularyCategory{ID: "22222222-2222-2222-2222-222222222222", Name: "General"},
	}

	tests := []struct {
		name      string
		setupMock func(m *mocks.MockVocabularyDeckRepository)
		wantErr   bool
		other     bool
	}{
		{
			name: "success: deck with category",
			setupMock: func(m *mocks.MockVocabularyDeckRepository) {
				m.On("GetDetail", mock.Anything, deckID).Return(graph, nil)
			},
			wantErr: false,
		},
		{
			name: "not found: missing id returns 404",
			setupMock: func(m *mocks.MockVocabularyDeckRepository) {
				m.On("GetDetail", mock.Anything, "missing").Return(nil, gorm.ErrRecordNotFound)
			},
			wantErr: true,
		},
		{
			name: "forbidden: another user's deck returns 403",
			setupMock: func(m *mocks.MockVocabularyDeckRepository) {
				m.On("GetDetail", mock.Anything, deckID).Return(graph, nil)
			},
			wantErr: true,
			other:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, mockRepo := setupDeck(t)
			tt.setupMock(mockRepo)

			id := deckID
			user := owner
			if tt.wantErr {
				id = "missing"
			}
			if tt.other {
				id = deckID
				user = "user_9"
			}
			res, err := svc.GetDetail(context.Background(), user, id)

			if tt.wantErr || tt.other {
				if tt.other {
					requireAppError(t, err, http.StatusForbidden)
				} else {
					requireAppError(t, err, http.StatusNotFound)
				}
				assert.Nil(t, res)
			} else {
				require.NoError(t, err)
				require.NotNil(t, res)
				require.NotNil(t, res.Category)
			}
		})
	}
}
