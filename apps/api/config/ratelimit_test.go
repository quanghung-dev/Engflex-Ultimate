package config_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"engflex-api/config"
)

func TestLoadRateLimitConfig(t *testing.T) {
	tests := []struct {
		name  string
		env   map[string]string
		check func(t *testing.T, got config.RateLimitConfig)
	}{
		{
			name: "defaults without env",
			env:  nil,
			check: func(t *testing.T, got config.RateLimitConfig) {
				t.Helper()
				assert.True(t, got.Enabled)
				assert.Equal(t, "60-M", got.GlobalRate)
				assert.Equal(t, "5-M", got.SessionRate)
				assert.Equal(t, "", got.RedisURL)
				assert.Equal(t, "engflex", got.RedisKeyPrefix)
				assert.Equal(t, "", got.TrustedProxies)
			},
		},
		{
			name: "env overrides",
			env: map[string]string{
				"RATE_LIMIT_ENABLED":         "false",
				"RATE_LIMIT_GLOBAL":          "100-M",
				"RATE_LIMIT_SESSION":         "10-M",
				"REDIS_URL":                  "redis://localhost:6379",
				"REDIS_KEY_PREFIX":           "test",
				"RATE_LIMIT_TRUSTED_PROXIES": "10.0.0.0/8",
			},
			check: func(t *testing.T, got config.RateLimitConfig) {
				t.Helper()
				assert.False(t, got.Enabled)
				assert.Equal(t, "100-M", got.GlobalRate)
				assert.Equal(t, "10-M", got.SessionRate)
				assert.Equal(t, "redis://localhost:6379", got.RedisURL)
				assert.Equal(t, "test", got.RedisKeyPrefix)
				assert.Equal(t, "10.0.0.0/8", got.TrustedProxies)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			for k, v := range tt.env {
				t.Setenv(k, v)
			}
			if tt.env == nil {
				t.Setenv("RATE_LIMIT_ENABLED", "")
				t.Setenv("RATE_LIMIT_GLOBAL", "")
				t.Setenv("RATE_LIMIT_SESSION", "")
			}
			tt.check(t, config.LoadRateLimitConfig())
		})
	}
}
