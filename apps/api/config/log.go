package config

import (
	"github.com/gianghp123/engflex-ultimate/internal/utils"
)

// LogConfig holds the structured logging settings.
// Values are read from LOG_LEVEL / LOG_FORMAT environment variables.
type LogConfig struct {
	// Level is one of debug, info, warn, error (default "info").
	Level string
	// Format is "text" or "json"; defaults to text in development and
	// json in every other environment.
	Format string
}

// LoadLogConfig reads the logging configuration from the environment.
// env is the runtime environment (see LoadServerConfig), used to pick the
// default format.
func LoadLogConfig(env string) LogConfig {
	format := utils.GetEnv("LOG_FORMAT", "")
	if format == "" {
		if env == "development" {
			format = "text"
		} else {
			format = "json"
		}
	}
	return LogConfig{
		Level:  utils.GetEnv("LOG_LEVEL", "info"),
		Format: format,
	}
}
