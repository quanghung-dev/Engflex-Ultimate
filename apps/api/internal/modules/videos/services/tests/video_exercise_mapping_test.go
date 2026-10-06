package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/database/models"
	"engflex-api/internal/modules/videos/dtos/responses"
	"engflex-api/internal/utils"
)

// The detail endpoint shape: an exercise maps with its category and
// transcripts nested, never flattened. copier matches Go field names, so a
// name mismatch here fails silently with empty values — this test pins the
// nesting end to end.
func TestVideoExerciseResponse_MapsNestedGraph(t *testing.T) {
	categoryID := "22222222-2222-2222-2222-222222222222"
	m := &models.VideoExercise{
		ID:         "11111111-1111-1111-1111-111111111111",
		CategoryID: &categoryID,
		Title:      "Trailer",
		Category:   &models.VideoCategory{ID: categoryID, Slug: "trailer", Name: "Trailer"},
		Transcripts: []*models.VideoTranscript{
			{ID: "33333333-3333-3333-3333-333333333333", VideoExerciseID: "11111111-1111-1111-1111-111111111111", Sequence: 1, Content: "hello"},
		},
	}

	var dto responses.VideoExerciseResponse
	require.NoError(t, utils.Map(&dto, m))

	require.NotNil(t, dto.Category)
	assert.Equal(t, "trailer", dto.Category.Slug)
	require.Len(t, dto.Transcripts, 1)
	assert.Equal(t, "hello", dto.Transcripts[0].Content)
	assert.Equal(t, 1, dto.Transcripts[0].Sequence)
}
