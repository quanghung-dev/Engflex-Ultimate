package tests

import (
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm/schema"

	"engflex-api/internal/database/models"
)

func TestLessonRelationsAreReadOnly(t *testing.T) {
	s, err := schema.Parse(&models.Lesson{}, &sync.Map{}, schema.NamingStrategy{})
	require.NoError(t, err)
	for _, name := range []string{"Section", "Activities"} {
		field, ok := s.FieldsByName[name]
		require.True(t, ok, "%s must remain a parsed field", name)
		assert.True(t, field.Readable)
		assert.False(t, field.Creatable)
		assert.False(t, field.Updatable)
	}
}

func TestLessonRelationsAreRegistered(t *testing.T) {
	s, err := schema.Parse(&models.Lesson{}, &sync.Map{}, schema.NamingStrategy{})
	require.NoError(t, err)

	t.Run("Section resolves to lesson_sections.id", func(t *testing.T) {
		rel, ok := s.Relationships.Relations["Section"]
		require.True(t, ok)
		require.Len(t, rel.References, 1)
		assert.False(t, rel.References[0].OwnPrimaryKey)
		assert.Equal(t, "id", rel.References[0].PrimaryKey.DBName)
		assert.Equal(t, "section_id", rel.References[0].ForeignKey.DBName)
	})

	t.Run("Activities resolves to lesson_activities.lesson_id", func(t *testing.T) {
		rel, ok := s.Relationships.Relations["Activities"]
		require.True(t, ok)
		require.Len(t, rel.References, 1)
		assert.True(t, rel.References[0].OwnPrimaryKey)
		assert.Equal(t, "id", rel.References[0].PrimaryKey.DBName)
		assert.Equal(t, "lesson_id", rel.References[0].ForeignKey.DBName)
	})
}
