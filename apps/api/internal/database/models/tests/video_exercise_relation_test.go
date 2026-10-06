package tests

import (
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm/schema"

	"engflex-api/internal/database/models"
)

// Both relations on VideoExercise are read-only by construction: Category
// joins in one round trip, Transcripts loads via a second query (has-many
// must not use Joins). "->" keeps each field a registered relationship so
// the read path can populate it, while excluding it from create/update so a
// populated graph never auto-saves duplicates. This test pins that contract
// from the parsed schema.
func TestVideoExerciseRelationsAreReadOnly(t *testing.T) {
	s, err := schema.Parse(&models.VideoExercise{}, &sync.Map{}, schema.NamingStrategy{})
	require.NoError(t, err)

	for _, name := range []string{"Category", "Transcripts"} {
		field, ok := s.FieldsByName[name]
		require.True(t, ok, "%s must remain a parsed field", name)
		assert.True(t, field.Readable,
			"%s must stay readable or the read path stops scanning into it", name)
		assert.False(t, field.Creatable,
			"a creatable %s makes GORM auto-save it on insert", name)
		assert.False(t, field.Updatable,
			"an updatable %s makes GORM auto-save it on update too", name)
	}
}

func TestVideoExerciseRelationsAreRegistered(t *testing.T) {
	s, err := schema.Parse(&models.VideoExercise{}, &sync.Map{}, schema.NamingStrategy{})
	require.NoError(t, err)

	t.Run("Category resolves to video_categories.id", func(t *testing.T) {
		rel, ok := s.Relationships.Relations["Category"]
		require.True(t, ok, "Joins(\"Category\") resolves through Relationships.Relations")
		require.Len(t, rel.References, 1)
		assert.False(t, rel.References[0].OwnPrimaryKey)
		assert.Equal(t, "id", rel.References[0].PrimaryKey.DBName)
		assert.Equal(t, "category_id", rel.References[0].ForeignKey.DBName)
	})

	t.Run("Transcripts resolves to video_transcripts.video_exercise_id", func(t *testing.T) {
		rel, ok := s.Relationships.Relations["Transcripts"]
		require.True(t, ok, "the transcript query groups through Relationships.Relations")
		require.Len(t, rel.References, 1)
		assert.True(t, rel.References[0].OwnPrimaryKey)
		assert.Equal(t, "id", rel.References[0].PrimaryKey.DBName)
		assert.Equal(t, "video_exercise_id", rel.References[0].ForeignKey.DBName)
	})
}
