package tests

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"engflex-api/internal/common"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/lessons/dtos/requests"
	"engflex-api/internal/modules/lessons/services"
)

func TestLessonService_List_UnknownSlug(t *testing.T) {
	svc, lessonMock, categoryMock := setupLesson(t)
	categoryMock.On("GetBySlug", mock.Anything, "nope").Return(nil, gorm.ErrRecordNotFound)

	res, total, err := svc.List(context.Background(), requests.ListLessons{CategorySlug: "nope"}, 20, 0)

	requireAppError(t, err, http.StatusNotFound)
	assert.Nil(t, res)
	assert.Zero(t, total)
	lessonMock.AssertNotCalled(t, "List", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestLessonService_List_BadID(t *testing.T) {
	svc, lessonMock, _ := setupLesson(t)
	lessonMock.On("List", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(nil, &common.InvalidIDError{Name: "id"})

	res, _, err := svc.List(context.Background(), requests.ListLessons{}, 20, 0)

	requireAppError(t, err, http.StatusBadRequest)
	assert.Nil(t, res)
}

func TestLessonActivityService_ListByLesson_EmptyReturns200(t *testing.T) {
	lessonID := "11111111-1111-1111-1111-111111111111"
	repo := mocks.NewMockLessonActivityRepository(t)
	repo.On("ListByLesson", mock.Anything, lessonID).
		Return(make([]*models.LessonActivity, 0), nil)
	svc := services.NewLessonActivityService(repo)

	res, err := svc.ListByLesson(context.Background(), lessonID)

	require.NoError(t, err)
	require.NotNil(t, res)
	assert.Empty(t, res)
}

func TestLessonBookmarkService_Save_Idempotent(t *testing.T) {
	userID := "user_1"
	lessonID := "11111111-1111-1111-1111-111111111111"
	row := &models.LessonBookmark{UserID: userID, LessonID: lessonID}
	repo := mocks.NewMockLessonBookmarkRepository(t)
	repo.On("Create", mock.Anything, mock.Anything).Return(nil)
	repo.On("Get", mock.Anything, userID, lessonID).Return(row, nil)
	svc := services.NewLessonBookmarkService(repo)

	for i := 0; i < 2; i++ {
		got, err := svc.Save(context.Background(), userID, lessonID)
		require.NoError(t, err)
		assert.Equal(t, lessonID, got.LessonID)
	}
}
