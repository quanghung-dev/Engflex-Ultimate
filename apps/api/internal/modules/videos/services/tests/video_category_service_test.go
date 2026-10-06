package tests

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/videos/dtos/requests"
)

func TestVideoCategoryService_Create(t *testing.T) {
	tests := []struct {
		name       string
		input      requests.CreateVideoCategory
		setupMock  func(m *mocks.MockVideoCategoryRepository)
		wantErr    bool
		wantStatus int
	}{
		{
			name:  "success: creates category",
			input: requests.CreateVideoCategory{Slug: "grammar", Name: "Grammar"},
			setupMock: func(m *mocks.MockVideoCategoryRepository) {
				m.On("Create", mock.Anything, mock.Anything).
					Run(func(args mock.Arguments) {
						cat := args.Get(1).(*models.VideoCategory)
						cat.ID = "11111111-1111-1111-1111-111111111111"
					}).
					Return(nil)
			},
			wantErr: false,
		},
		{
			name:  "conflict: duplicate name returns 409",
			input: requests.CreateVideoCategory{Slug: "grammar", Name: "Grammar"},
			setupMock: func(m *mocks.MockVideoCategoryRepository) {
				m.On("Create", mock.Anything, mock.Anything).
					Return(&pgconn.PgError{Code: "23505"})
			},
			wantErr:    true,
			wantStatus: http.StatusConflict,
		},
		{
			name:  "internal: db error returns 500",
			input: requests.CreateVideoCategory{Slug: "grammar", Name: "Grammar"},
			setupMock: func(m *mocks.MockVideoCategoryRepository) {
				m.On("Create", mock.Anything, mock.Anything).
					Return(errors.New("db connection failure"))
			},
			wantErr:    true,
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, mockRepo := setup(t)
			tt.setupMock(mockRepo)

			res, err := svc.Create(context.Background(), tt.input)

			if tt.wantErr {
				requireAppError(t, err, tt.wantStatus)
				assert.Nil(t, res)
			} else {
				require.NoError(t, err)
				require.NotNil(t, res)
				assert.Equal(t, "11111111-1111-1111-1111-111111111111", res.ID)
				assert.Equal(t, tt.input.Name, res.Name)
			}
		})
	}
}
