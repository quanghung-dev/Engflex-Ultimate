package tests

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/modules/lessons/controllers"
	"engflex-api/internal/modules/lessons/dtos/requests"
	"engflex-api/internal/modules/lessons/dtos/responses"
)

type stubLessonService struct {
	sections []*models.LessonSection
}

func (s stubLessonService) ListSections(ctx context.Context, req requests.ListLessons) ([]*models.LessonSection, error) {
	return s.sections, nil
}

func (s stubLessonService) GetDetail(ctx context.Context, id string) (*models.Lesson, error) {
	return nil, gorm.ErrRecordNotFound
}

func TestLessonList_SectionFirst(t *testing.T) {
	b1 := &models.LessonSection{ID: "sec-b1", Slug: "b1", Title: "B1 Threshold", CEFRBand: enums.CEFR("B1"), Position: 3}
	b2 := &models.LessonSection{ID: "sec-b2", Slug: "b2", Title: "B2 Vantage", CEFRBand: enums.CEFR("B2"), Position: 4}
	units := func(sec *models.LessonSection, n int) []*models.Lesson {
		out := make([]*models.Lesson, 0, n)
		for i := 0; i < n; i++ {
			out = append(out, &models.Lesson{
				ID: string(rune('a' + len(sec.ID) + i)), Slug: sec.Slug, Title: sec.Title,
				SectionID: sec.ID, CEFRLevel: sec.CEFRBand, Section: sec,
			})
		}
		return out
	}

	tests := []struct {
		name       string
		sections   []*models.LessonSection
		wantSecs   int
		wantUnits  int
		wantTitles []string
	}{
		{
			name: "whole path beyond old page size",
			sections: []*models.LessonSection{
				{ID: b1.ID, Slug: b1.Slug, Title: b1.Title, CEFRBand: b1.CEFRBand, Position: b1.Position, Units: units(b1, 15)},
				{ID: b2.ID, Slug: b2.Slug, Title: b2.Title, CEFRBand: b2.CEFRBand, Position: b2.Position, Units: units(b2, 10)},
			},
			wantSecs:   2,
			wantUnits:  25,
			wantTitles: []string{"B1 Threshold", "B2 Vantage"},
		},
		{
			name: "single section maps whole",
			sections: []*models.LessonSection{
				{ID: b1.ID, Slug: b1.Slug, Title: b1.Title, CEFRBand: b1.CEFRBand, Position: b1.Position, Units: units(b1, 1)},
			},
			wantSecs:   1,
			wantUnits:  1,
			wantTitles: []string{"B1 Threshold"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctl := controllers.NewLessonController(stubLessonService{sections: tt.sections})

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/lessons", nil)

			ctl.List(c)

			require.Equal(t, http.StatusOK, w.Code)
			var body struct {
				Data []responses.UnitSection `json:"data"`
			}
			require.NoError(t, json.Unmarshal(w.Body.Bytes(), &body))
			require.Len(t, body.Data, tt.wantSecs)
			got, titles := 0, make([]string, 0, len(body.Data))
			for _, s := range body.Data {
				got += len(s.Units)
				titles = append(titles, s.Title)
			}
			assert.Equal(t, tt.wantUnits, got)
			assert.Equal(t, tt.wantTitles, titles)
		})
	}
}
