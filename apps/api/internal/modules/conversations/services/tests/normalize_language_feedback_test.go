package tests

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/database/models"
	"engflex-api/internal/modules/conversations/services"
)

// The engine contract is five keys, always present. This is the only gate
// between an external service's JSON and a stored coaching record, and it had
// no coverage at all: the function was exported for a test nobody wrote.
func TestNormalizeLanguageFeedback(t *testing.T) {
	tests := []struct {
		name        string
		raw         string
		wantStatus  int
		wantTip     string
		wantSpans   int
		wantRawFail bool
	}{
		{
			name:      "accepts the full contract and decodes every field",
			raw:       goodFeedback,
			wantTip:   "past tense",
			wantSpans: 0,
		},
		{
			name:      "a null spans array is normalized so the panel can map it",
			raw:       `{"corrected":"I went yesterday.","spans":null,"relevance":{"status":"relevant","reason":null},"alternatives":{"language":null,"contextual":null},"tip":"past tense"}`,
			wantTip:   "past tense",
			wantSpans: 0,
		},
		{
			name:       "rejects a missing key",
			raw:        `{"corrected":"I went yesterday.","relevance":{"status":"relevant"},"alternatives":{"language":null,"contextual":null},"tip":"past tense"}`,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "rejects an empty corrected string",
			raw:        `{"corrected":"","spans":[],"relevance":{"status":"relevant"},"alternatives":{"language":null,"contextual":null},"tip":"past tense"}`,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "rejects an empty tip",
			raw:        `{"corrected":"I went yesterday.","spans":[],"relevance":{"status":"relevant"},"alternatives":{"language":null,"contextual":null},"tip":""}`,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:        "a body that is not an object is a raw decode error",
			raw:         `"just a string"`,
			wantRawFail: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := services.NormalizeLanguageFeedback(json.RawMessage(tt.raw))

			if tt.wantRawFail {
				require.Error(t, err)
				assert.Equal(t, models.TurnFeedback{}, got)
				return
			}
			if tt.wantStatus != 0 {
				requireAppError(t, err, tt.wantStatus)
				assert.Equal(t, models.TurnFeedback{}, got)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.wantTip, got.Tip)
			assert.Len(t, got.Spans, tt.wantSpans)
			// The panel maps this array directly, so it must never serialize
			// as null.
			encoded, err := json.Marshal(got)
			require.NoError(t, err)
			assert.Contains(t, string(encoded), `"spans":[]`)
		})
	}
}
