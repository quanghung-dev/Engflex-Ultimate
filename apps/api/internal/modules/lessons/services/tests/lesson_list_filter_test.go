package tests

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/modules/lessons/dtos/requests"
)

func TestLessonService_List_HonorsLevelFilter(t *testing.T) {
	svc, lessonMock, _ := setupLesson(t)
	lessonMock.On("List", mock.Anything, (*string)(nil), enums.CEFR("B1"), 20, 0).
		Return([]*models.Lesson{{ID: "a"}}, nil)
	lessonMock.On("Count", mock.Anything, (*string)(nil), enums.CEFR("B1")).Return(int64(1), nil)

	items, total, err := svc.List(context.Background(), requests.ListLessons{Level: enums.CEFR("B1")}, 20, 0)

	require.NoError(t, err)
	assert.Len(t, items, 1)
	assert.Equal(t, int64(1), total)
}
