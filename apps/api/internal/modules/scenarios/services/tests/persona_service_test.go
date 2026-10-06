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
	repomocks "engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/scenarios/services"
)

func TestPersonaGetByID(t *testing.T) {
	tests := []struct {
		name    string
		id      string
		setup   func(*repomocks.MockPersonaRepository)
		wantID  string
		wantErr int
	}{
		{
			name: "returns the persona",
			id:   "1833728f-f95c-548b-9ba9-a9b80d91b201",
			setup: func(repo *repomocks.MockPersonaRepository) {
				repo.On("GetByID", mock.Anything, "1833728f-f95c-548b-9ba9-a9b80d91b201").
					Return(&models.Persona{ID: "1833728f-f95c-548b-9ba9-a9b80d91b201", Name: "Amelia"}, nil).Once()
			},
			wantID: "1833728f-f95c-548b-9ba9-a9b80d91b201",
		},
		{
			name: "unknown id maps to 404",
			id:   "00000000-0000-0000-0000-000000000000",
			setup: func(repo *repomocks.MockPersonaRepository) {
				repo.On("GetByID", mock.Anything, "00000000-0000-0000-0000-000000000000").
					Return(nil, gorm.ErrRecordNotFound).Once()
			},
			wantErr: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := repomocks.NewMockPersonaRepository(t)
			tt.setup(repo)
			svc := services.NewPersonaService(repo)

			got, err := svc.GetByID(context.Background(), tt.id)

			if tt.wantErr != 0 {
				requireAppError(t, err, tt.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.wantID, got.ID)
		})
	}
}
