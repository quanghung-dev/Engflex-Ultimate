package config

import "engflex-api/internal/utils"

// RedisConfig holds the shared Redis connection settings. Features build
// their own client from it (rate limiting today); an empty URL selects the
// feature's non-Redis fallback (the limiter's in-memory store). Set REDIS_URL
// for multi-replica prod.
type RedisConfig struct {
	URL       string
	KeyPrefix string
}

// LoadRedisConfig reads shared Redis settings from the environment.
func LoadRedisConfig() RedisConfig {
	return RedisConfig{
		URL:       utils.GetEnv("REDIS_URL", ""),
		KeyPrefix: utils.GetEnv("REDIS_KEY_PREFIX", "engflex"),
	}
}
