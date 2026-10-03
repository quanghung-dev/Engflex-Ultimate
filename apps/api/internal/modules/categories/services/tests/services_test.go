package tests
import (
	"testing"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"engflex-api/internal/common"
	"engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/categories/services"
)
func setup(t *testing.T) (services.CategoryService, *mocks.MockCategoryRepository) {
	mockRepo := mocks.NewMockCategoryRepository(t)
	svc := services.NewCategoryService(mockRepo)
	return svc, mockRepo
}
func requireAppError(t *testing.T, err error, expectedStatus int) *common.AppError {
	require.Error(t,err)
	var appErr *common.AppError
    require.ErrorAs(t, err, &appErr)
	assert.Equal(t, expectedStatus, appErr.Status)
	return appErr
}