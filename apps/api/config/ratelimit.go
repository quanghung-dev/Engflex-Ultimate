package config

import "engflex-api/internal/utils"

// RateLimitConfig holds request throttling settings.
// Rates use ulule/limiter formatted strings ("<limit>-<period>",
// S/M/H/D, e.g. "60-M"). The Redis store is selected via RedisConfig;
// empty Redis URL keeps the in-memory store (single-replica dev/CI).
// TrustedProxies is a comma-separated list of CIDRs whose X-Forwarded-For
// the limiter trusts; empty trusts none (spoofed headers ignored, buckets
// key on RemoteAddr). Set the platform LB CIDR in prod.
type RateLimitConfig struct {
	Enabled        bool
	GlobalRate     string
	SessionRate    string
	TrustedProxies string
}

// LoadRateLimitConfig reads rate limiting settings from the environment.
func LoadRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		Enabled:        utils.GetEnvBool("RATE_LIMIT_ENABLED", true),
		GlobalRate:     utils.GetEnv("RATE_LIMIT_GLOBAL", "60-M"),
		SessionRate:    utils.GetEnv("RATE_LIMIT_SESSION", "5-M"),
		TrustedProxies: utils.GetEnv("RATE_LIMIT_TRUSTED_PROXIES", ""),
	}
}
