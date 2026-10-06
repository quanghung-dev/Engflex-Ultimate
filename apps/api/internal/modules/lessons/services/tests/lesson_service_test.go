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

func TestLessonService_GetDetail(t *testing.T) {
	lessonID := "11111111-1111-1111-1111-111111111111"
	graph := &models.Lesson{
		ID: lessonID, Slug: "unit-1", Title: "Unit 1",
		CategoryID: "22222222-2222-2222-2222-222222222222",
		Category:   &models.LessonCategory{ID: "22222222-2222-2222-2222-222222222222", Slug: "general", Name: "General"},
		Activities: []*models.LessonActivity{
			{ID: "33333333-3333-3333-3333-333333333333", LessonID: lessonID, PartNumber: 1, Title: "Part 1"},
		},
	}

	tests := []struct {
		name      string
		setupMock func(m *mocks.MockLessonRepository)
		wantErr   bool
	}{
		{
			name: "success: returns lesson with category and activities",
			setupMock: func(m *mocks.MockLessonRepository) {
				m.On("GetDetail", mock.Anything, lessonID).Return(graph, nil)
			},
			wantErr: false,
		},
		{
			name: "not found: missing id returns 404",
			setupMock: func(m *mocks.MockLessonRepository) {
				m.On("GetDetail", mock.Anything, "missing").Return(nil, gorm.ErrRecordNotFound)
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, lessonMock, _ := setupLesson(t)
			tt.setupMock(lessonMock)

			id := lessonID
			if tt.wantErr {
				id = "missing"
			}
			res, err := svc.GetDetail(context.Background(), id)

			if tt.wantErr {
				requireAppError(t, err, http.StatusNotFound)
				assert.Nil(t, res)
			} else {
				require.NoError(t, err)
				require.NotNil(t, res)
				require.NotNil(t, res.Category)
				assert.Equal(t, "general", res.Category.Slug)
				require.Len(t, res.Activities, 1)
			}
		})
	}
}
