package utils

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// LoadDotEnv loads KEY=VALUE pairs from the given files into the process
// environment via godotenv. Real environment variables always win over .env
// values (godotenv never overwrites existing vars).
//
// When no path is given, ".env" in the working directory is tried and a
// missing file is silently skipped (returns nil). Explicit paths that cannot
// be read return the underlying error.
func LoadDotEnv(paths ...string) error {
	if len(paths) == 0 {
		paths = []string{".env"}
		if _, err := os.Stat(".env"); os.IsNotExist(err) {
			return nil
		}
	}

	return godotenv.Load(paths...)
}

// GetEnv returns the value of key, or fallback when unset or empty.
func GetEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// MustGetEnv returns the value of key, or panics when unset or empty.
// Use for required configuration at startup so misconfiguration fails fast.
func MustGetEnv(key string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	panic("missing required environment variable: " + key)
}

// GetEnvInt returns the integer value of key, or fallback when unset,
// empty, or unparseable.
func GetEnvInt(key string, fallback int) int {
	raw, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(raw) == "" {
		return fallback
	}
	n, err := strconv.Atoi(strings.TrimSpace(raw))
	if err != nil {
		return fallback
	}
	return n
}

// GetEnvBool returns the boolean value of key, or fallback when unset,
// empty, or unparseable. Accepts strconv.ParseBool syntax
// (1, t, T, TRUE, true, True, 0, f, ...).
func GetEnvBool(key string, fallback bool) bool {
	raw, ok := os.LookupEnv(key)
	if !ok || strings.TrimSpace(raw) == "" {
		return fallback
	}
	b, err := strconv.ParseBool(strings.TrimSpace(raw))
	if err != nil {
		return fallback
	}
	return b
}
