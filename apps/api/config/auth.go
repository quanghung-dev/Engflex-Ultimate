package config

import (
	"github.com/gianghp123/engflex-ultimate/internal/utils"
)

// AuthConfig holds authentication settings.
// Values are read from CLERK_SECRET_KEY environment variables.
type AuthConfig struct {
	// ClerkSecretKey authenticates the API against Clerk (never exposed to clients).
	ClerkSecretKey string
}

// LoadAuthConfig reads the auth configuration from the environment.
// Empty when Clerk is not configured; the server refuses to start (see main.go).
func LoadAuthConfig() AuthConfig {
	return AuthConfig{
		ClerkSecretKey: utils.GetEnv("CLERK_SECRET_KEY", ""),
	}
}
