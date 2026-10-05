package tests

import (
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm/schema"

	"engflex-api/internal/database/models"
)

// The Feedback relation on ConversationTurn is read-only by construction.
//
// Without a write barrier GORM treats a populated Feedback as an association to
// save: upserting a turn that came back from ListTurnsWithFeedback silently
// INSERTs a duplicate feedbacks row — err == nil, RowsAffected unchanged, and
// nothing in the logs says so. That was reproduced against a real database
// before this test existed.
//
// "->" is the only fix that keeps both halves: the field stays a registered
// relationship (so Joins("Feedback") populates it and the Feedback__* aliases
// still scan) while SelectAndOmitColumns marks it excluded from create and
// update. This test asserts both halves from the parsed schema, so a
// "simplification" back to a bare foreignKey tag fails here.
func TestTurnFeedbackRelationIsReadOnly(t *testing.T) {
	s, err := schema.Parse(&models.ConversationTurn{}, &sync.Map{}, schema.NamingStrategy{})
	require.NoError(t, err)

	field, ok := s.FieldsByName["Feedback"]
	require.True(t, ok, "Feedback must remain a parsed field")

	t.Run("readable so the join can populate it", func(t *testing.T) {
		assert.True(t, field.Readable,
			"Readable must stay true or Joins(\"Feedback\") stops scanning into it")
	})

	t.Run("not creatable or updatable so the relation is never saved", func(t *testing.T) {
		assert.False(t, field.Creatable,
			"a creatable Feedback makes GORM auto-save a duplicate feedbacks row on insert")
		assert.False(t, field.Updatable,
			"an updatable Feedback makes GORM auto-save on update too")
	})

	t.Run("keeps enough permission to register as a relationship", func(t *testing.T) {
		// This is the assertion that separates "->" from "-". The registration
		// gate in schema.go is:
		//     DataType == "" && GORMDataType == "" && (Creatable || Updatable || Readable)
		// so Readable alone is what keeps the field in relationshipFields. "-"
		// clears all three permissions, dropping the relation: Joins("Feedback")
		// then resolves to nothing, the LEFT JOIN vanishes from the SQL, and
		// every turn comes back with a nil Feedback — a silent empty coaching
		// panel. Verified against a real database, not inferred.
		assert.True(t, field.Creatable || field.Updatable || field.Readable,
			"all permissions false unregisters the relation; \"->\" must keep Readable true")
	})

	t.Run("still a registered relationship", func(t *testing.T) {
		rel, ok := s.Relationships.Relations["Feedback"]
		require.True(t, ok,
			"Joins(\"Feedback\") resolves through Relationships.Relations; without it the join silently degrades")
		// The polymorphic pair resolves to conversation_turns.id =
		// feedbacks.subject_id, which is the ON clause ListTurnsWithFeedback
		// needs. OwnPrimaryKey puts the parent column on the left.
		require.Len(t, rel.References, 1)
		assert.True(t, rel.References[0].OwnPrimaryKey)
		assert.Equal(t, "id", rel.References[0].PrimaryKey.DBName)
		assert.Equal(t, "subject_id", rel.References[0].ForeignKey.DBName)
	})
}
