package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/common/enums"
	"engflex-api/internal/database/models"
)

func TestLessonDetailsScan(t *testing.T) {
	tests := []struct {
		name      string
		value     any
		wantDur   int
		wantPct   int
		wantCover string
		wantSkill enums.ActivityType
		wantEmpty bool
	}{
		{
			name:      "camelCase blob decodes every field",
			value:     []byte(`{"estimatedDurationMin":12,"acousticTargetPct":80,"coverImageUrl":"https://cdn.test/cover.png","skill":"dictation"}`),
			wantDur:   12,
			wantPct:   80,
			wantCover: "https://cdn.test/cover.png",
			wantSkill: enums.ActivityTypeDictation,
		},
		{
			name:      "absent optional keys stay zero",
			value:     []byte(`{"coverImageUrl":""}`),
			wantCover: "",
			wantEmpty: true,
		},
		{
			name:      "NULL leaves the zero value",
			value:     nil,
			wantEmpty: true,
		},
		{
			name:      "malformed JSON leaves the zero value",
			value:     []byte("{not json"),
			wantEmpty: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var got models.LessonDetails
			require.NoError(t, got.Scan(tt.value))

			if tt.wantEmpty {
				assert.Equal(t, models.LessonDetails{}, got)
				return
			}
			require.NotNil(t, got.EstimatedDurationMin)
			assert.Equal(t, tt.wantDur, *got.EstimatedDurationMin)
			require.NotNil(t, got.AcousticTargetPct)
			assert.Equal(t, tt.wantPct, *got.AcousticTargetPct)
			assert.Equal(t, tt.wantCover, got.CoverImageURL)
			require.NotNil(t, got.Skill)
			assert.Equal(t, tt.wantSkill, *got.Skill)
		})
	}
}

func TestLessonDetailsValue(t *testing.T) {
	duration := 12
	target := 80
	skill := enums.ActivityTypeDictation
	in := models.LessonDetails{
		EstimatedDurationMin: &duration,
		AcousticTargetPct:    &target,
		CoverImageURL:        "https://cdn.test/cover.png",
		Skill:                &skill,
	}

	raw, err := in.Value()
	require.NoError(t, err)
	encoded, ok := raw.([]byte)
	require.True(t, ok)

	assert.JSONEq(t, `{"estimatedDurationMin":12,"acousticTargetPct":80,"coverImageUrl":"https://cdn.test/cover.png","skill":"dictation"}`, string(encoded))

	var back models.LessonDetails
	require.NoError(t, back.Scan(encoded))
	assert.Equal(t, in, back)
}
