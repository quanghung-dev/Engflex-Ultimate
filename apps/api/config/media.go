package config

import (
	"strings"

	"engflex-api/internal/utils"
)

// MediaConfig locates the public lesson-media bucket (MinIO in dev). Audio
// URLs are composed from BaseURL + object key, so prod can point a CDN at a
// different base without touching code.
type MediaConfig struct {
	BaseURL string
}

// LoadMediaConfig reads MEDIA_BASE_URL; the default targets the compose MinIO.
func LoadMediaConfig() MediaConfig {
	return MediaConfig{
		BaseURL: strings.TrimRight(utils.GetEnv("MEDIA_BASE_URL", "http://localhost:9000/lesson-audio"), "/"),
	}
}

// URL joins the base URL and an object key without double slashes. An empty
// key yields "" so DTO fields stay clean when a payload is absent.
func (c MediaConfig) URL(key string) string {
	key = strings.TrimLeft(strings.TrimSpace(key), "/")
	if key == "" {
		return ""
	}
	base := strings.TrimRight(c.BaseURL, "/")
	if base == "" {
		return key
	}
	return base + "/" + key
}
