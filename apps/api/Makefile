-include .env
export

MIGRATIONS_DIR ?= internal/database/migrations

.PHONY: migration-create migration-up migration-down migration-status migration-reset mocks contracts swagger

# usage: make migration-create name=your_migration_name
migration-create:
	@goose -dir $(MIGRATIONS_DIR) create $(name) sql

migration-up:
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" up

migration-down:
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" down

migration-status:
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" status

migration-reset:
	@goose -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" reset

# regenerate repository mocks (see .mockery.yaml)
mocks:
	@mockery

# regenerate TypeScript contracts in packages/contracts (see tygo.yaml)
contracts:
	@tygo generate

# regenerate swagger docs in docs/ (served at /swagger/*any)
swagger:
	@swag init -g cmd/server/main.go
