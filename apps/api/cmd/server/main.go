package main

import (
	"log/slog"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/gianghp123/engflex-ultimate/config"
	"github.com/gianghp123/engflex-ultimate/internal/logger"
	"github.com/gianghp123/engflex-ultimate/internal/server"
)

// @title			EngFlex API
// @version		1.0
// @description	English learning control plane. Success responses use the {message, data[, pagination]} envelope; failures use {message} with the HTTP status code.
// @host			localhost:8000
// @BasePath		/api/v1
// @securitydefinitions.apikey	BearerAuth
// @in							header
// @name						Authorization
// @description				Clerk session token: "Bearer <token>"
func main() {
	// Load .env (when present) + environment into a typed config.
	// Run from apps/api so the default ".env" resolves.
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// Install the structured logger before anything else logs.
	slog.SetDefault(logger.New(cfg.Log.Level, cfg.Log.Format))

	// Gin's debug output is development noise.
	if cfg.Server.Env != "development" {
		gin.SetMode(gin.ReleaseMode)
	}

	if cfg.Auth.ClerkSecretKey == "" {
		slog.Error("missing CLERK_SECRET_KEY")
		os.Exit(1)
	}
	clerk.SetKey(cfg.Auth.ClerkSecretKey)

	slog.Info("starting engflex api",
		"env", cfg.Server.Env,
		"addr", cfg.Server.Addr(),
		"database", cfg.Database.LogValue(),
	)

	db, err := gorm.Open(postgres.Open(cfg.Database.DSN()), &gorm.Config{})
	if err != nil {
		slog.Error("failed to open database", "error", err)
		os.Exit(1)
	}

	router := server.NewRouter(db, cfg.Cors)

	if err := router.Run(cfg.Server.Addr()); err != nil {
		slog.Error("server exited unexpectedly", "error", err)
		os.Exit(1)
	}
}
