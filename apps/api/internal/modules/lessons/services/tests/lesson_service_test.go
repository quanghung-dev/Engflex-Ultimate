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
		CEFRLevel: "B1",
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
			name: "success: returns unit with activities",
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
			svc, _, lessonMock := setupLesson(t)
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
				require.Len(t, res.Activities, 1)
			}
		})
	}
}

func TestLessonService_GetDetailBySlug(t *testing.T) {
	unit := &models.Lesson{ID: "11111111-1111-1111-1111-111111111111", Slug: "unit-1", Title: "Unit 1"}
	tests := []struct {
		name       string
		slug       string
		setupMock  func(m *mocks.MockLessonRepository)
		wantStatus int
	}{
		{
			name: "found: returns the unit",
			slug: "unit-1",
			setupMock: func(m *mocks.MockLessonRepository) {
				m.On("GetDetailBySlug", mock.Anything, "unit-1").Return(unit, nil)
			},
			wantStatus: 0,
		},
		{
			name: "not found: unknown slug returns 404",
			slug: "nope",
			setupMock: func(m *mocks.MockLessonRepository) {
				m.On("GetDetailBySlug", mock.Anything, "nope").Return(nil, gorm.ErrRecordNotFound)
			},
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, _, lessonMock := setupLesson(t)
			tt.setupMock(lessonMock)

			res, err := svc.GetDetailBySlug(context.Background(), tt.slug)

			if tt.wantStatus == 0 {
				require.NoError(t, err)
				require.NotNil(t, res)
				assert.Equal(t, "unit-1", res.Slug)
				return
			}
			requireAppError(t, err, tt.wantStatus)
			assert.Nil(t, res)
		})
	}
}
