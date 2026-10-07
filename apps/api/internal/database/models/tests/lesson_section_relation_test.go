package tests

import (
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm/schema"

	"engflex-api/internal/database/models"
)

func TestLessonSectionUnitsAreReadOnly(t *testing.T) {
	s, err := schema.Parse(&models.LessonSection{}, &sync.Map{}, schema.NamingStrategy{})
	require.NoError(t, err)
	field, ok := s.FieldsByName["Units"]
	require.True(t, ok, "Units must remain a parsed field")
	assert.True(t, field.Readable)
	assert.False(t, field.Creatable)
	assert.False(t, field.Updatable)
}

func TestLessonSectionUnitsAreRegistered(t *testing.T) {
	s, err := schema.Parse(&models.LessonSection{}, &sync.Map{}, schema.NamingStrategy{})
	require.NoError(t, err)
	rel, ok := s.Relationships.Relations["Units"]
	require.True(t, ok)
	require.Len(t, rel.References, 1)
	assert.True(t, rel.References[0].OwnPrimaryKey)
	assert.Equal(t, "id", rel.References[0].PrimaryKey.DBName)
	assert.Equal(t, "section_id", rel.References[0].ForeignKey.DBName)
}
