MIGRATIONS_DIR ?= internal/database/migrations

# Default DATABASE_URL from apps/api/.env so goose works without exporting it
# by hand. `?=` — NOT `include .env` — is the load-bearing part: a makefile
# assignment overrides the environment, so `include` would let the .env value
# clobber a real DATABASE_URL (the e2e suite migrates a dedicated database and
# was silently migrating the dev one). Missing file is fine (CI passes env).
ifneq (,$(wildcard .env))
	DATABASE_URL ?= $(shell sed -n 's/^DATABASE_URL=//p' .env | head -1)
endif

.PHONY: migration-create migration-up migration-down mocks contracts swagger

# usage: make migration-create name=your_migration_name
migration-create:
	@goose -dir $(MIGRATIONS_DIR) create $(name) sql

migration-up:
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" up

migration-down:
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" down

# regenerate repository mocks (see .mockery.yaml)
mocks:
	@mockery

# regenerate TypeScript contracts in packages/contracts (see tygo.yaml)
contracts:
	@tygo generate

# regenerate swagger docs in docs/ (served at /swagger/*any)
swagger:
	@swag init -g cmd/server/main.go
