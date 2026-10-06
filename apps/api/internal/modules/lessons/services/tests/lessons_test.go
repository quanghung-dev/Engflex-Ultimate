package tests

import (
	"testing"

	"engflex-api/internal/common"
	"engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/lessons/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupLesson(t *testing.T) (services.LessonService, *mocks.MockLessonRepository, *mocks.MockLessonCategoryRepository) {
	t.Helper()
	lessonMock := mocks.NewMockLessonRepository(t)
	categoryMock := mocks.NewMockLessonCategoryRepository(t)
	categorySvc := services.NewLessonCategoryService(categoryMock)
	svc := services.NewLessonService(lessonMock, categorySvc)
	return svc, lessonMock, categoryMock
}

func requireAppError(t *testing.T, err error, expectedStatus int) *common.AppError {
	t.Helper()
	require.Error(t, err)
	var appErr *common.AppError
	require.ErrorAs(t, err, &appErr)
	assert.Equal(t, expectedStatus, appErr.Status)
	return appErr
}
