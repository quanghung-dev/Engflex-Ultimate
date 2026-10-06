package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/database/models"
	"engflex-api/internal/modules/vocabulary/dtos/responses"
	"engflex-api/internal/utils"
)

func TestUserVocabularyState_CarriesItemID(t *testing.T) {
	m := &models.UserVocabulary{UserID: "user_1", ItemID: "11111111-1111-1111-1111-111111111111", Mastered: true}

	var dto responses.UserVocabularyState
	require.NoError(t, utils.Map(&dto, m))
	assert.Equal(t, "11111111-1111-1111-1111-111111111111", dto.ItemID)
}
