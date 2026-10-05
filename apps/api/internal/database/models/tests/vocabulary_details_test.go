package tests

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"engflex-api/internal/database/models"
)

func TestVocabularyDetailsScan(t *testing.T) {
	tests := []struct {
		name       string
		value      any
		wantLong   string
		wantCtx    int
		wantQuote  string
		wantPhrase string
		wantForms  int
		wantEmpty  bool
	}{
		{
			name:       "camelCase blob decodes every nested document",
			value:      []byte(`{"audioUs":"https://cdn.test/us.mp3","audioUk":"","syllables":"eye · dem · poh · tent","stressTip":"stress on the third syllable","commonSlip":"","longDefinition":"Denoting an idempotent operation.","etymology":"Latin idem + potens","contexts":[{"label":"Webhook delivery","quote":"Retries are safe."}],"collocations":[{"phrase":"strictly idempotent","pattern":"adv + adj","example":"strictly idempotent handler"}],"wordForms":[{"formType":"noun","forms":["idempotence"]}]}`),
			wantLong:   "Denoting an idempotent operation.",
			wantCtx:    1,
			wantQuote:  "Retries are safe.",
			wantPhrase: "strictly idempotent",
			wantForms:  1,
		},
		{
			name:      "empty object leaves zero values",
			value:     []byte(`{}`),
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
			var got models.VocabularyDetails
			require.NoError(t, got.Scan(tt.value))

			if tt.wantEmpty {
				assert.Equal(t, models.VocabularyDetails{}, got)
				return
			}
			assert.Equal(t, "https://cdn.test/us.mp3", got.AudioUS)
			assert.Equal(t, tt.wantLong, got.LongDefinition)
			require.Len(t, got.Contexts, tt.wantCtx)
			assert.Equal(t, tt.wantQuote, got.Contexts[0].Quote)
			require.Len(t, got.Collocations, 1)
			assert.Equal(t, tt.wantPhrase, got.Collocations[0].Phrase)
			require.Len(t, got.WordForms, tt.wantForms)
			assert.Equal(t, []string{"idempotence"}, got.WordForms[0].Forms)
		})
	}
}

func TestVocabularyDetailsValue(t *testing.T) {
	in := models.VocabularyDetails{
		AudioUS:        "https://cdn.test/us.mp3",
		Syllables:      "eye · dem · poh · tent",
		LongDefinition: "Denoting an idempotent operation.",
		Etymology:      "Latin idem + potens",
		Contexts:       []models.VocabularyContext{{Label: "Webhook delivery", Quote: "Retries are safe."}},
		Collocations:   []models.Collocation{{Phrase: "strictly idempotent", Pattern: "adv + adj"}},
		WordForms:      []models.WordForm{{FormType: "noun", Forms: []string{"idempotence"}}},
	}

	raw, err := in.Value()
	require.NoError(t, err)
	encoded, ok := raw.([]byte)
	require.True(t, ok)

	var back models.VocabularyDetails
	require.NoError(t, back.Scan(encoded))
	assert.Equal(t, in, back)
}
