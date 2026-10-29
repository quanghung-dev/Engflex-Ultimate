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
	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/database/repositories/mocks"
	"engflex-api/internal/modules/bookmarks/services"
)

func requireAppError(t *testing.T, err error, expectedStatus int) *common.AppError {
	require.Error(t, err)
	var appErr *common.AppError
	require.ErrorAs(t, err, &appErr)
	assert.Equal(t, expectedStatus, appErr.Status)
	return appErr
}

func TestBookmarkService_Save_Idempotent(t *testing.T) {
	userID := "user_1"
	storyID := "11111111-1111-1111-1111-111111111111"
	row := &models.Bookmark{UserID: userID, ContentType: enums.ContentTypeStory, ContentID: storyID}

	tests := []struct {
		name        string
		contentType enums.ContentType
		contentID   string
	}{
		{"story bookmark", enums.ContentTypeStory, storyID},
		{"lesson bookmark", enums.ContentTypeLesson, "22222222-2222-2222-2222-222222222222"},
		{"video bookmark", enums.ContentTypeVideo, "33333333-3333-3333-3333-333333333333"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := mocks.NewMockBookmarkRepository(t)
			repo.On("Create", mock.Anything, mock.MatchedBy(func(b *models.Bookmark) bool {
				return b.UserID == userID && b.ContentType == tt.contentType && b.ContentID == tt.contentID
			})).Return(nil)
			repo.On("Get", mock.Anything, userID, string(tt.contentType), tt.contentID).Return(row, nil)
			svc := services.NewBookmarkService(repo)

			got, err := svc.Save(context.Background(), userID, tt.contentType, tt.contentID)
			require.NoError(t, err)
			assert.Equal(t, storyID, got.ContentID)
		})
	}
}

func TestBookmarkService_ListByUser(t *testing.T) {
	userID := "user_1"
	rows := []*models.Bookmark{
		{UserID: userID, ContentType: enums.ContentTypeStory, ContentID: "11111111-1111-1111-1111-111111111111"},
		{UserID: userID, ContentType: enums.ContentTypeLesson, ContentID: "22222222-2222-2222-2222-222222222222"},
	}

	tests := []struct {
		name        string
		contentType string
		mockReturn  []*models.Bookmark
		mockErr     error
		wantErr     bool
		wantStatus  int
		wantLen     int
	}{
		{"list all bookmarks", "", rows, nil, false, 0, 2},
		{"list story bookmarks", "story", rows[:1], nil, false, 0, 1},
		{"db error mapped to 500", "", nil, gorm.ErrInvalidDB, true, http.StatusInternalServerError, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := mocks.NewMockBookmarkRepository(t)
			repo.On("ListByUser", mock.Anything, userID, tt.contentType).Return(tt.mockReturn, tt.mockErr)
			svc := services.NewBookmarkService(repo)

			items, err := svc.ListByUser(context.Background(), userID, tt.contentType)
			if tt.wantErr {
				requireAppError(t, err, tt.wantStatus)
				assert.Nil(t, items)
				return
			}
			require.NoError(t, err)
			assert.Len(t, items, tt.wantLen)
		})
	}
}

func TestBookmarkService_Unsave(t *testing.T) {
	userID := "user_1"
	contentID := "11111111-1111-1111-1111-111111111111"

	tests := []struct {
		name       string
		mockErr    error
		wantErr    bool
		wantStatus int
	}{
		{"successful unsave", nil, false, 0},
		{"not found returns 404", gorm.ErrRecordNotFound, true, http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := mocks.NewMockBookmarkRepository(t)
			repo.On("Delete", mock.Anything, userID, "story", contentID).Return(tt.mockErr)
			svc := services.NewBookmarkService(repo)

			err := svc.Unsave(context.Background(), userID, "story", contentID)
			if tt.wantErr {
				requireAppError(t, err, tt.wantStatus)
				return
			}
			require.NoError(t, err)
		})
	}
}
