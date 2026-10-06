# EngFlex API — Go Control Plane

Go + Gin + GORM backend. It owns data, auth, and business logic — and
**provisions** AI voice sessions (persona/context/token) without ever touching
realtime audio. See the [root README](../../README.md) for the full system picture.

## Layout

```
cmd/server/main.go          # Entrypoint: wires config + router only, no business logic
config/                     # Auth, cors, database, log, server, voice
docs/                       # Generated Swagger (served at /swagger)
internal/
  common/                   # AppError, ApiResponse envelope, enums, shared limits
  database/
    migrations/             # Goose SQL — source of truth (never AutoMigrate; one migration per table)
    models/                 # GORM structs + TableName() + scopes (no gorm.Model)
    repositories/           # Hand-written repos over *gorm.DB + mocks/
  logger/                   # slog setup (New/NewWithWriter/Report/WithRequestID/WithUserID)
  modules/<domain>/         # attempts, conversations, lessons, profiles, scenarios, videos, vocabulary
    module.go               # RegisterRoutes(rg, deps...) — wiring only
    controllers/            # Gin handlers + Swagger annotations, no SQL
    services/               # Business logic (returns *Model / []*Model + error, no gin)
    dtos/requests|responses # Wire DTOs (tygo inputs, gin binding tags)
  server/middleware/        # RequireAuth, RequestID, RequestLogger, Recovery
  utils/                    # Map/MapSlice, ParsePagination/Offset, IDs, Slug
```

All routes mount under `/api/v1` (`internal/server/router.go`).

## Quickstart

```bash
make migration-up        # goose up (DATABASE_URL from .env)
go run ./cmd/server
```

## Commands

| Task | Command |
|------|---------|
| All tests | `go test ./... -count=1` |
| One suite | `go test ./internal/modules/<domain>/... -count=1 -v` |
| Vet / fmt | `go vet ./...`, `gofmt -l internal/` (must be empty) |
| Mocks | `make mocks` (mockery v3, generated only) |
| Contracts | `make contracts` (`tygo generate` → `packages/contracts`) |
| New migration | `make migration-create name=...` |
| Apply / rollback | `make migration-up` / `migration-down` |
| Swagger | `make swagger` |

Pre-deploy rule: edit the existing migration in place and re-run it
(`make migration-down` then `make migration-up`) instead of adding corrective
migrations.

## Conventions (see `AGENTS.md`)

- **Models:** explicit IDs/timestamps, `clerk_user_id text PK` on profile, all
  `user_id` FKs are Clerk strings. Read-mostly relations use `gorm:"->"`.
- **Repositories:** one per table, named for the model returned; return
  pointers (`*Model` / `[]*Model`); one method = one query; never custom structs.
- **Services:** constructors take interfaces; map DB errors via
  `common.FromDBError`; log via `slog`/`logger.Report`; map with
  `utils.Map`/`MapSlice` (one call per mapping).
- **Controllers:** `ShouldBindJSON` → `common.BadRequest`; pagination via
  `utils.ParsePagination`; fixed `ApiResponse` envelope (`OK/Created/Paginated/Fail`).
- **DTOs** mirror model shape (nested, never flattened); cross-package types in
  DTOs break tygo — keep wire copies in the DTO package.
- **Errors:** see `readme.md` (Vietnamese error-handling reference) and
  `internal/common/errors.go`.
- **Tests:** per-package `tests/` dirs, table-driven, mocks mandatory, never hit
  a real DB in unit tests.
