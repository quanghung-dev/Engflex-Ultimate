package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/database/models"
)

func mustScan(t *testing.T, raw string) models.ScenarioDetail {
	t.Helper()
	var d models.ScenarioDetail
	require.NoError(t, d.Scan([]byte(raw)))
	return d
}

func TestScenarioDetailScan(t *testing.T) {
	tests := []struct {
		name      string
		raw       string
		wantRole  string
		wantVocab int
		wantLabel string
		wantText  string
	}{
		{
			name:      "full blob decodes substance",
			raw:       `{"role": "Tech Lead", "context": ["a", "b"], "opening": {"label": "Tom:", "text": "hi"}, "vocab": ["w1", "w2"]}`,
			wantRole:  "Tech Lead",
			wantVocab: 2,
			wantLabel: "Tom:",
			wantText:  "hi",
		},
		{
			name: "empty object yields zero detail",
			raw:  `{}`,
		},
		{
			name: "malformed json yields zero detail without error",
			raw:  `{oops`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mustScan(t, tt.raw)
			assert.Equal(t, tt.wantRole, got.Role)
			assert.Len(t, got.Vocab, tt.wantVocab)
			assert.Equal(t, tt.wantLabel, got.Opening.Label)
			assert.Equal(t, tt.wantText, got.Opening.Text)
		})
	}
}

func TestScenarioDetailScanNull(t *testing.T) {
	var d models.ScenarioDetail
	require.NoError(t, d.Scan(nil))
	assert.Equal(t, models.ScenarioDetail{}, d)
}
