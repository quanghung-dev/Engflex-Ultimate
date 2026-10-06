package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/database/models"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/utils"
)

func TestLessonDetailResponse_MapsNestedGraph(t *testing.T) {
	m := &models.Lesson{
		ID: "11111111-1111-1111-1111-111111111111", Slug: "unit-1", Title: "Unit 1",
		CategoryID: "22222222-2222-2222-2222-222222222222",
		Category:   &models.LessonCategory{ID: "22222222-2222-2222-2222-222222222222", Slug: "general", Name: "General"},
		Activities: []*models.LessonActivity{
			{ID: "33333333-3333-3333-3333-333333333333", LessonID: "11111111-1111-1111-1111-111111111111", PartNumber: 1, Title: "Part 1"},
		},
	}

	var dto responses.LessonDetail
	require.NoError(t, utils.Map(&dto, m))
	require.NotNil(t, dto.Category)
	assert.Equal(t, "general", dto.Category.Slug)
	require.Len(t, dto.Activities, 1)
	assert.Equal(t, 1, dto.Activities[0].PartNumber)
}
