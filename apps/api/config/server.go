package config

import (
	"github.com/gianghp123/engflex-ultimate/internal/utils"
)

// ServerConfig holds the HTTP server settings.
// Values are read from PORT / APP_ENV environment variables.
type ServerConfig struct {
	// Port is the TCP port to listen on, without a leading colon (e.g. "8000").
	Port string
	// Env is the runtime environment name (e.g. "development", "production").
	Env string
}

// LoadServerConfig reads the server configuration from the environment.
// Defaults match apps/api/.env for local development.
func LoadServerConfig() ServerConfig {
	return ServerConfig{
		Port: utils.GetEnv("PORT", "8000"),
		Env:  utils.GetEnv("APP_ENV", "development"),
	}
}

// Addr returns the listen address in ":port" form.
func (c ServerConfig) Addr() string {
	return ":" + c.Port
}
