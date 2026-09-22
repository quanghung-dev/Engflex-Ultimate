package config

import (
	"strings"

	"github.com/gianghp123/engflex-ultimate/internal/utils"
)

// CorsConfig holds the CORS settings.
// Values are read from the CORS_ORIGINS environment variable
// (comma-separated, e.g. "https://app.example,http://localhost:5173").
//
// NOTE (dev): the router currently allows all origins; this config is kept
// so production can restrict origins without a code change.
type CorsConfig struct {
	// AllowedOrigins are the origins allowed to call the API.
	AllowedOrigins []string
}

// LoadCorsConfig reads the CORS configuration from the environment.
// Defaults cover local Vite development.
func LoadCorsConfig() CorsConfig {
	raw := utils.GetEnv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5199")
	origins := make([]string, 0, 2)
	for _, origin := range strings.Split(raw, ",") {
		if trimmed := strings.TrimSpace(origin); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return CorsConfig{AllowedOrigins: origins}
}
