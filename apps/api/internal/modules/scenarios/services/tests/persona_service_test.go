package tests

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"

	repomocks "engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/scenarios/services"
)

func TestPersonaGetByID(t *testing.T) {
	tests := []struct {
		name    string
		id      string
		setup   func(*repomocks.MockPersonaRepository)
		wantErr int
	}{
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

			_, err := svc.GetByID(context.Background(), tt.id)

			requireAppError(t, err, tt.wantErr)
		})
	}
}
