package tests

import (
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm/schema"

	"engflex-api/internal/database/models"
)

// ExamTest on Attempt is read-only by construction: "->" keeps the field
// a registered relationship so Joins("ExamTest") can populate it, while
// excluding it from create/update so an attempt read-modify-write cycle
// never attempts to insert or update the referenced exam_tests row.
func TestAttemptExamTestRelationIsReadOnly(t *testing.T) {
	s, err := schema.Parse(&models.Attempt{}, &sync.Map{}, schema.NamingStrategy{})
	require.NoError(t, err)

	field, ok := s.FieldsByName["ExamTest"]
	require.True(t, ok, "ExamTest must remain a parsed field")

	t.Run("readable so Joins(\"ExamTest\") can populate it", func(t *testing.T) {
		assert.True(t, field.Readable,
			"Readable must stay true or Joins(\"ExamTest\") stops scanning into it")
	})

	t.Run("not creatable or updatable so the exam test is never auto-saved", func(t *testing.T) {
		assert.False(t, field.Creatable,
			"a creatable ExamTest makes GORM auto-save/insert exam_tests on attempt save")
		assert.False(t, field.Updatable,
			"an updatable ExamTest makes GORM auto-save on attempt update")
	})

	t.Run("registered belongs-to relationship", func(t *testing.T) {
		rel, ok := s.Relationships.Relations["ExamTest"]
		require.True(t, ok, "Joins(\"ExamTest\") resolves through Relationships.Relations")
		assert.Equal(t, schema.BelongsTo, rel.Type)
		require.Len(t, rel.References, 1)
		assert.False(t, rel.References[0].OwnPrimaryKey)
		assert.Equal(t, "id", rel.References[0].PrimaryKey.DBName)
		assert.Equal(t, "exam_test_id", rel.References[0].ForeignKey.DBName)
	})
}
