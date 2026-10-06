package tests

import (
	"engflex-api/internal/common"
	"engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/videos/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
)

func setup(t *testing.T) (services.VideoCategoryService, *mocks.MockVideoCategoryRepository) {
	mockRepo := mocks.NewMockVideoCategoryRepository(t)
	svc := services.NewVideoCategoryService(mockRepo)
	return svc, mockRepo
}
func requireAppError(t *testing.T, err error, expectedStatus int) *common.AppError {
	require.Error(t, err)
	var appErr *common.AppError
	require.ErrorAs(t, err, &appErr)
	assert.Equal(t, expectedStatus, appErr.Status)
	return appErr
}
