package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/datatypes"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
	"engflex-api/internal/modules/lessons/dtos/responses"
	"engflex-api/internal/utils"
)

func TestActivityResponse_SplitsConfigPayload(t *testing.T) {
	m := &models.LessonActivity{
		ID:         "33333333-3333-3333-3333-333333333333",
		LessonID:   "11111111-1111-1111-1111-111111111111",
		PartNumber: 1, Type: enums.ActivityTypeReading, Title: "Part 1",
		Config: datatypes.JSON(`{"passage":"hello","questions":[{"stem":"s","instruction":"i","options":[{"key":"a","text":"t"}]}]}`),
	}

	var dto responses.Activity
	require.NoError(t, utils.Map(&dto, m))
	dto.SplitPayload(m.Type, m.Config)

	require.NotNil(t, dto.Reading)
	assert.Equal(t, "hello", dto.Reading.Passage)
	require.Len(t, dto.Reading.Questions, 1)
	assert.Nil(t, dto.Dictation)
	assert.Nil(t, dto.Writing)
	assert.Nil(t, dto.Voice)
}

func TestActivityResponse_UnknownTypeLeavesPayloadsNil(t *testing.T) {
	var dto responses.Activity
	dto.SplitPayload("not-a-type", datatypes.JSON(`{"passage":"x"}`))

	assert.Nil(t, dto.Reading)
	assert.Nil(t, dto.Dictation)
	assert.Nil(t, dto.Writing)
	assert.Nil(t, dto.Voice)
}
