package config

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadVoiceConfig(t *testing.T) {
	tests := []struct {
		name              string
		env               map[string]string
		wantURL           string
		wantMax           int
		wantStart         time.Duration
		wantOffer         time.Duration
		wantPronounceURL  string
		wantPronounceTout time.Duration
	}{
		{
			name:              "defaults",
			env:               map[string]string{"VOICE_INTERNAL_SECRET": "s3cret"},
			wantURL:           "http://localhost:7860",
			wantMax:           300,
			wantStart:         15 * time.Second,
			wantOffer:         10 * time.Second,
			wantPronounceURL:  "http://localhost:8001",
			wantPronounceTout: 120 * time.Second,
		},
		{
			name: "overrides",
			env: map[string]string{
				"VOICE_INTERNAL_SECRET":  "s3cret",
				"VOICE_SERVICE_URL":      "http://127.0.0.1:9000",
				"VOICE_MAX_DURATION_SEC": "120",
				"VOICE_START_TIMEOUT_MS": "5000",
				"VOICE_OFFER_TIMEOUT_MS": "2500",
				"PRONOUNCE_SERVICE_URL":  "http://127.0.0.1:8001",
				"PRONOUNCE_TIMEOUT_MS":   "30000",
			},
			wantURL:           "http://127.0.0.1:9000",
			wantMax:           120,
			wantStart:         5 * time.Second,
			wantOffer:         2500 * time.Millisecond,
			wantPronounceURL:  "http://127.0.0.1:8001",
			wantPronounceTout: 30 * time.Second,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			for k, v := range tt.env {
				t.Setenv(k, v)
			}
			cfg := LoadVoiceConfig()
			assert.Equal(t, tt.wantURL, cfg.ServiceURL)
			assert.Equal(t, tt.wantMax, cfg.MaxDurationSec)
			assert.Equal(t, tt.wantStart, cfg.StartTimeout)
			assert.Equal(t, tt.wantOffer, cfg.OfferTimeout)
			assert.Equal(t, tt.wantPronounceURL, cfg.PronounceURL)
			assert.Equal(t, tt.wantPronounceTout, cfg.PronounceTimeout)
			require.NotEmpty(t, cfg.InternalSecret)
		})
	}
}

func TestLoadVoiceConfigRequiresSecret(t *testing.T) {
	require.Panics(t, func() {
		// Ensure no ambient value leaks through.
		t.Setenv("VOICE_INTERNAL_SECRET", "")
		LoadVoiceConfig()
	})
}
