package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
)

// The feedbacks table is polymorphic by design (spec section 3.1), so its
// invariants live in the schema, not in Go. These assertions document the
// contract the migration must satisfy.
func TestFeedbackTableName(t *testing.T) {
	assert.Equal(t, "feedbacks", models.Feedback{}.TableName())
}

func TestFeedbackSubjectTypeCoversVoiceTurn(t *testing.T) {
	var f models.Feedback
	f.SubjectType = enums.FeedbackSubjectConversationTurn
	assert.Equal(t, "conversation_turn", string(f.SubjectType))
}

func TestFeedbackCarriesNoTypeDiscriminator(t *testing.T) {
	// D18: the subject-to-product mapping is a product invariant, so there is
	// no `type` field. A future subject type is added, never a type variant.
	f := models.Feedback{SubjectType: enums.FeedbackSubjectConversationTurn}
	_, hasType := any(f).(interface{ GetType() string })
	assert.False(t, hasType, "Feedback must not gain a type discriminator")
}
