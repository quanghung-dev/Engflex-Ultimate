package tests

import (
	"context"
	"errors"
	"net/http"
	"os"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"gorm.io/datatypes"
	"gorm.io/gorm"

	"engflex-api/internal/common"
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	repomocks "engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/exams/dtos/requests"
	"engflex-api/internal/modules/exams/services"
)

func TestStartRejectsInvalidChoices(t *testing.T) {
	tests := []struct {
		name string
		req  requests.StartAttempt
	}{
		{"invalid mode", requests.StartAttempt{Mode: "other", SelectedParts: []int{1}}},
		{"empty selection", requests.StartAttempt{Mode: enums.ExamModePractice}},
		{"duplicate selection", requests.StartAttempt{Mode: enums.ExamModePractice, SelectedParts: []int{1, 1}}},
		{"out of range", requests.StartAttempt{Mode: enums.ExamModePractice, SelectedParts: []int{8}}},
		{"incomplete full exam", requests.StartAttempt{Mode: enums.ExamModeExam, SelectedParts: []int{1, 2}}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			attempts := repomocks.NewMockAttemptRepository(t)
			tests := repomocks.NewMockExamTestRepository(t)
			tx := repomocks.NewMockTransactionManager(t)
			svc := services.NewAttemptService(attempts, tests, tx)
			_, err := svc.Start(context.Background(), "user", "test", tt.req)
			var appErr *common.AppError
			require.ErrorAs(t, err, &appErr)
			require.Equal(t, http.StatusBadRequest, appErr.Status)
			tx.AssertNotCalled(t, "Run", mock.Anything, mock.Anything)
		})
	}
}

func TestStartMapsRepositoryAndContentFailures(t *testing.T) {
	raw, err := os.ReadFile("../../toeic/tests/testdata/synthetic.json")
	require.NoError(t, err)
	tests := []struct {
		name              string
		test              *models.ExamTest
		getErr, createErr error
		status            int
	}{
		{"missing test", nil, gorm.ErrRecordNotFound, nil, http.StatusNotFound},
		{"unsupported type", &models.ExamTest{Category: &models.ExamCategory{Type: "other"}}, nil, nil, http.StatusUnprocessableEntity},
		{"invalid content", &models.ExamTest{Category: &models.ExamCategory{Type: enums.ExamTypeTOEIC}, Content: datatypes.JSON(`{}`)}, nil, nil, http.StatusInternalServerError},
		{"write failure", &models.ExamTest{ID: "test", Category: &models.ExamCategory{Type: enums.ExamTypeTOEIC}, Content: datatypes.JSON(raw)}, nil, errors.New("database failed"), http.StatusInternalServerError},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			attempts := repomocks.NewMockAttemptRepository(t)
			repo := repomocks.NewMockExamTestRepository(t)
			transactions := repomocks.NewMockTransactionManager(t)
			transaction := &gorm.DB{}
			transactions.On("Run", mock.Anything, mock.Anything).Return(func(_ context.Context, fn func(*gorm.DB) error) error { return fn(transaction) })
			repo.On("WithTx", transaction).Return(repo)
			repo.On("GetForUpdate", mock.Anything, "test").Return(tt.test, tt.getErr)
			if tt.createErr != nil {
				attempts.On("WithTx", transaction).Return(attempts)
				attempts.On("Create", mock.Anything, mock.Anything).Return(tt.createErr)
			}
			svc := services.NewAttemptService(attempts, repo, transactions)
			_, err := svc.Start(context.Background(), "user", "test", requests.StartAttempt{Mode: enums.ExamModePractice, SelectedParts: []int{1}})
			var appErr *common.AppError
			require.ErrorAs(t, err, &appErr)
			require.Equal(t, tt.status, appErr.Status)
		})
	}
}
