# engflex-ultimate — Contributor Guide

> Stack: Go + Gin + GORM (control plane), PostgreSQL, Clerk auth.
> AI Voice (Python + Pipecat) is a separate stateless service, **uv-managed**
> (`pyproject.toml` + `uv.lock` + `.python-version`; always `uv run`) — Go never
> proxies audio.
> Frontend: Vite + TS + TanStack Start/Router, TanStack Store/Query, Clerk, shadcn/ui, Paraglide i18n.
> Run Go commands from `<api-dir>` (e.g. `apps/api`).

Monorepo (optional): `<api-dir>` (Go), `<web-dir>` (frontend),
`<contracts-dir>` (generated TypeScript shared package), `<voice-dir>` (Python +
Pipecat, uv-managed, independent).

## Standing preferences (human decisions — do not override without asking)

- **No commits.** Leave all work uncommitted in the working tree unless the human
  explicitly asks for a commit. `docs/` is gitignored by intent — specs, plans
  and ledgers are never committed.
- **Use the library, don't reinvent it.** Prefer library-provided integrations
  over custom implementations; verify claims against the installed code
  (`node_modules`, generated output), not training data or pasted snippets.
- **Web i18n (Paraglide + inlang message-format):** locales `vi` (base/default)
  + `en` only.
  - `messages/{locale}/<domain>.json`, each file nested under its domain key
    (the plugin merges all files into one flat id namespace — unprefixed
    duplicates silently override each other).
  - Strategy `["cookie", "baseLocale"]` — never `url` (path prefixes 404 in
    TanStack Router and are client-only, causing SSR mismatch). SSR locale via
    the official `paraglideMiddleware` in `src/start.ts` `requestMiddleware`;
    never import `node:*` in hand-written `src` (it leaks into the client
    bundle — the lib lazy-imports it internally).
  - `pnpm compile:messages` before typecheck; `src/paraglide/` is
    generated-only, never hand-edit.
  - Scope: UI chrome localized; fixture/learning content (lesson titles, terms,
    transcripts, passages) stays English. EN copy verbatim from mocks; VI authored.
  - Locale-sensitive code must resolve at render: breadcrumb `staticData`
    labels and `PART_META` labels are thunks; fixture-held chrome keyed by item id.
- **Web routes:** directory convention (`_app/route.tsx`,
  `_app/lessons/index.tsx`), not dotted flat names.
- **Web gates (no test framework):** `pnpm check`, `pnpm exec tsc --noEmit`,
  `pnpm build`, plus HTTP/SSR probes. Changes to `src/start.ts` /
  `vite.config.ts` require a dev-server restart (HMR cannot apply them).

## Folder structure (`<api-dir>`)

```text
cmd/server/main.go          # entrypoint; wires config + router only, no business logic
config/                     # auth, config, cors, database, log, server
docs/                       # generated swagger (swag); served at /swagger
internal/
  common/                   # AppError, ApiResponse envelope, shared constants/limits
  database/
    migrations/             # goose SQL — source of truth for schema (never AutoMigrate)
    models/                 # gorm structs + TableName() + scopes (no gorm.Model)
    repositories/           # hand-written repos over *gorm.DB + mocks/
  logger/                   # slog setup (New/NewWithWriter/Report/WithRequestID/WithUserID)
  modules/<domain>/         # contents, exercises, attempts, vocabulary, personas, conversations, feedback, profiles
    module.go               # RegisterRoutes(rg *gin.RouterGroup, deps...) — wiring only
    controllers/            # gin handlers (HTTP), swagger annotations, no SQL
    services/               # business logic (returns *Model / []*Model + error, no gin)
    dtos/requests|responses # wire DTOs (tygo inputs, gin binding tags)
  server/middleware/        # RequireAuth, RequestID, RequestLogger, Recovery
  utils/                    # Map/MapSlice, ParsePagination/Offset, IDs, Slug
```

No `live/` or `transports/` here: realtime audio goes FE ↔ Python directly over
WebRTC. Go only provisions AI sessions (persona/context/token) and ingests
results (transcript/feedback) afterwards.

## Models, Router, Service, Repo — GORM only

### Model (GORM)

```go
type UserProfile struct {
  ClerkUserID string `gorm:"primaryKey;type:text"` // Clerk subject, no users table
  Level       string
  Goals       []string `gorm:"type:text[]"`
}
func (UserProfile) TableName() string { return "user_profiles" }
```

- Explicit IDs/timestamps, no `gorm.Model`.
- `clerk_user_id text PK` on profile; all `user_id` FKs are Clerk strings.
- JSON columns (`config`, `score`) as `datatypes.JSON` / custom types.
- Arrays (`goals`, `skill_tags`, `topic`) as `pq.StringArray` / `text[]`.
- `time.Time` → RFC3339 string in contracts.

### Repository (DB access only, no HTTP, no business rules)

Returns pointers: single `*Model`, list `[]*Model`. Never return values.

```go
type AttemptRepository interface {
  Create(ctx context.Context, m *models.Attempt) error
  GetByID(ctx context.Context, id string) (*models.Attempt, error)
  ListByUser(ctx context.Context, userID string, limit, offset int) ([]*models.Attempt, error)
  CountByUser(ctx context.Context, userID string) (int64, error)
  WithTx(tx *gorm.DB) AttemptRepository
}
func NewAttemptRepository(db *gorm.DB) AttemptRepository
```

- One method = one query. Aggregates (e.g. Progress over `attempts`) live in repos
  via query builder / `db.Raw()`, never string-built in services.
- No joins in services; add a repo method instead.
- All repo interfaces get mockery mocks in `repositories/mocks/`.

### Service (business logic, returns *Model / []*Model + error)

```go
func (s *AttemptService) CreateAttempt(ctx context.Context, userID string, req requests.CreateAttempt) (*models.Attempt, error)
func (s *AttemptService) ListAttempts(ctx context.Context, userID string, limit, offset int) ([]*models.Attempt, int64, error)
```

- Constructors take interfaces, never concretes:
  `NewAttemptService(attempts AttemptRepository, contents ContentRepository)`.
- Map DB errors at the boundary: `common.FromDBError(err, "<resource>")`,
  log with `logger.Report(ctx, "op failed", appErr, "k", v)`.
  Success path: `slog.InfoContext`.
- No `gin.Context`, no `c.JSON`, no SQL strings here.
- Domain rules live here: difficulty heuristic on content create, completion-status
  derivation, AI session provisioning (persona/context/token), feedback async rules.

### Controller + Router (HTTP in/out, no SQL)

`modules/<domain>/module.go`:
```go
func RegisterRoutes(rg *gin.RouterGroup, repo repositories.AttemptRepository, ...) {
  svc := services.NewAttemptService(repo)
  ctl := controllers.NewAttemptController(svc)
  g := rg.Group("/attempts")
  g.POST("", middleware.RequireAuth(), ctl.Create)
  g.GET("", middleware.RequireAuth(), ctl.List)
  g.GET("/:id", middleware.RequireAuth(), ctl.GetByID)
}
```
`internal/server/router.go: func NewRouter(db *gorm.DB, ...) *gin.Engine` mounts
all `RegisterRoutes` under `/api/v1` + global `RequestID, RequestLogger, Recovery, CORS`.

Controller pattern:
```go
func (h *Ctl) Create(c *gin.Context) {
  var req requests.CreateAttempt
  if err := c.ShouldBindJSON(&req); err != nil { common.Fail(c, common.BadRequest(...)); return }
  userID := middleware.UserID(c) // Clerk subject, used directly as FK
  m, err := h.service.CreateAttempt(c.Request.Context(), userID, req)
  if err != nil { common.Fail(c, err); return }
  var dto responses.Attempt
  _ = utils.Map(&dto, m)
  common.Created(c, "created", dto)
}
```
- Input: `ShouldBindJSON`/`ShouldBindQuery`/`Param` → `common.BadRequest` on fail.
- Pagination: `utils.ParsePagination(c)` → `Offset()` → `List+Count` → `MapSlice`.
- Keep swagger annotations on handlers.

### Input (DTOs + validation)

- `dtos/requests/*.go`: gin `binding:"required,..."` tags.
  Limits MUST equal `internal/common` constants, guarded by a `limits_test.go`.
- `dtos/responses/*.go`: wire DTOs only (tygo inputs). Map via `utils.Map/MapSlice`.
- `time.Time` → RFC3339 string in contracts.

### Response format (fixed envelope)

```go
// internal/common/response.go
type ApiResponse struct { Message string `json:"message"`; Data any `json:"data,omitempty"`; Pagination *Pagination `json:"pagination,omitempty"` }
func OK(c, message, data)      // 200
func Created(c, message, data) // 201
func Paginated(c, message, data, page, pageSize, total)
func Fail(c, err) // *AppError -> {message}+Status, else hidden 500
```

Errors `internal/common/errors.go` (GORM mapping):
`BadRequest/Unauthorized/Forbidden/NotFound/Conflict/UnprocessableEntity/TooManyRequests/Internal/ServiceUnavailable`
as `*AppError`.

| DB outcome | GORM | HTTP |
| --- | --- | --- |
| bad ID | `InvalidIDError` / parse fail | 400 |
| no rows | `gorm.ErrRecordNotFound` | 404 `<resource> not found` |
| unique | duplicate key / `23505` | 409 |
| FK | `23503` / constraint | 404/422 |
| else | — | 500 hidden |

Assert with `require.ErrorAs(err, &appErr)` + check `.Status`.

## Code style (Go)

- `gofmt` clean, `go vet` clean. No `nil` into constructors.
- Status codes via `net/http` consts, never hardcoded ints.
- `slog` via `logger` package only (see Logging convention).

## Logging convention

- Setup once in `main.go`: `slog.SetDefault(logger.New(cfg.Log.Level, cfg.Log.Format))`.
  `text` in development, `json` elsewhere. `debug` also enables source locations.
- Services log via stdlib `slog` package-level funcs with request ctx:
  success `slog.InfoContext(ctx, "op done", "k", v)`,
  failure `logger.Report(ctx, "op failed", appErr, "k", v)`.
  `Report` maps `*AppError`: 4xx → Warn, 5xx/unknown → Error.
- Never `fmt.Print`/`log.Print`/`slog.New` at call sites.
- Context carries `request_id` + `user_id` (canonical `userID`, Clerk subject):
  `logger.WithRequestID/WithUserID`, auto-attached by `contextHandler`.
- Middleware: `RequestID()` honors/generates + echoes `X-Request-ID`;
  `RequireAuth()` stamps `userID` into gin ctx + log ctx;
  `RequestLogger()` writes one record per request
  (`method,path,status,duration_ms,client_ip,size`), skips `/healthz` + `/swagger/`;
  `Recovery()` logs panic + stack via `slog.ErrorContext`, returns `common.Internal()`.
- Tests: `logger.NewWithWriter(buf, level, format)` for buffer assertions
  (no ANSI in buffers, JSON fields, `Report` level mapping).

## Shared contracts package (Go DTOs → TypeScript)

- Config `<api-dir>/tygo.yaml`; output `<contracts-dir>/src/*.ts`.
- Commands (from `<api-dir>`): `make contracts` or `tygo generate`.
- Rules: generated files overwritten — hand code only in
  `<contracts-dir>/src/index.ts` (barrel). `time.Time` → RFC3339 string.
  Export only wire DTOs; runtime structs must not leak.
  `common/errors.go` excluded (`AppError` never crosses).
- Frontend imports types + limit constants from `<contracts-pkg>` only.

## Web structure (`<web-dir>` — TanStack Start + Router, TanStack Store/Query, Clerk, shadcn/ui, Paraglide i18n)

```text
<web-dir>/
  messages/{en,vi}/<domain>.json  # inlang source (common, nav, onboarding, dashboard, lessons, vocabulary, voice, progress)
  project.inlang/settings.json    # baseLocale vi, locales [en,vi], pathPattern array
  vite.config.ts                  # paraglideVitePlugin strategy ["cookie","baseLocale"]
  src/
    app/
      app-route.ts                # APP_ROUTES (frontend URLs — use instead of hardcoding paths)
      api-routes.ts               # backend paths only (/attempts, /contents/:id...), no hardcoded URLs elsewhere
      breadcrumbs.ts              # breadcrumb protocol: staticData specs, targets from APP_ROUTES (labels are thunks)
    assets/topics/*.png
    components/
      common/                     # Logo, PageHeader, StatCard, CefrBadge, SourcePill, AudioButton, Kbd, ProgressBar
      layout/                     # AppShell, AppSidebar, Topbar, LocaleSwitcher (EN/VI pill)
      ui/*                        # shadcn primitives (a11y copy via common.a11y.*)
    features/<domain>/            # attempts, dashboard, dictation, lessons, onboarding, profiles, reading, vocabulary, voice, writing
      components/                 # presentational only; copy via m["<domain>.*"](), never hardcoded UI strings
      fixtures.ts                 # mock-only data (learning content stays English)
      store.ts                    # @tanstack/store where state is cross-screen (profiles, lessons, vocabulary, voice)
      types.ts | parts.ts | dates.ts | diff.ts | scripts.ts  # domain-local helpers, only where needed
    hooks/use-mobile.ts
    integrations/
      clerk/                      # provider, header-user
      tanstack-query/             # root-provider, devtools
    lib/
      api.ts                      # fetch wrapper (envelope unwrap, ApiError)
      auth-guard.ts               # Clerk guard: beforeLoad + server auth() probe + <Show> defence-in-depth
      auth-token.ts               # token getter bridge for non-component api.*
      paraglide-middleware.ts     # official paraglideMiddleware in requestMiddleware (no node:* imports)
      utils.ts
    paraglide/                    # generated-only (messages/runtime/server), never hand-edit
    routes/                       # directory convention; thin shells composing features + layout
      __root.tsx, _app/route.tsx (Clerk guard) + _app/<domain>/..., onboarding.tsx, about.tsx, sign-in/out
    router.tsx, start.ts (requestMiddleware), styles.css, routeTree.gen.ts, env.ts
```

- `lib/api.*` pattern: base URL from env, Bearer from auth provider,
  envelope `{message,data,pagination}` unwrap, `!ok -> ApiError(status,message)`.
- `features` pattern (mock phase, no fetching layer yet): `fixtures.ts` (typed
  consts, `@tanstack/store` where cross-screen, `useState` for ephemeral)
  → `components/` → `routes/` (thin shell). Types via
  `import type {...} from '<contracts-pkg>'`; fixture-held UI chrome lives in
  `messages/` keyed by item id, never duplicated in fixtures.
- Breadcrumbs come from the router's match chain: each route declares
  `staticData: breadcrumb(...)`, `Topbar` renders links from declared targets.
  Neither route ids nor paths are hardcoded outside `APP_ROUTES`.
- Fixed stack: Vite + TS + TanStack Start/Router, TanStack Store/Query, Clerk,
  shadcn/ui + Tailwind, Paraglide (cookie strategy, vi default).
- Voice screens talk WebRTC directly to `<voice-dir>`; Go is never in the audio path.

## mockery (generated mocks only)

- `mockery v3` (testify template). Config `<api-dir>/.mockery.yaml`.
- Command: `make mocks` (or `mockery`) from `<api-dir>`.
- Generated, never hand-edit: `internal/database/repositories/mocks/mock_*.go`
  plus any other interface mocks under owning package `mocks/`.
- Exception (concrete structs only): one hand-maintained factory allowed,
  e.g. `internal/<pkg>/mocks/mock_client.go`. No other hand-written `Mock` structs.

## testify

- `github.com/stretchr/testify`: `require` for fatal premises
  (`NoError`, `NotNil`, `Len`, `ErrorAs`), `assert` for value checks
  (`Equal`, `Contains`, `True/False`). `mock.Anything` for expectations;
  mocks auto-`AssertExpectations` via `t.Cleanup`.
- `requireAppError(t, err, http.StatusX)` helper per service tests package.

## Test style (mandatory)

- Location: per-package `tests/` dirs, external black-box `package tests`.
  Shared fixtures in `services/tests/services_test.go`-style helpers.
- Table-driven, always: `tests := []struct{ name ... }{...}` +
  `for _, tt := range tests { t.Run(tt.name, ...) }`. No single-case tests.
- Mocks mandatory via `repositories/mocks`. Never pass `nil` into constructors.
- GORM: mock via repo interface (preferred) or `sqlmock`; assert
  `ErrRecordNotFound→404`, duplicate→409. Never hit a real DB in unit tests.

## Commands (`<api-dir>`)

| Task | Command |
| --- | --- |
| All tests | `go test ./... -count=1` |
| One suite | `go test ./internal/modules/<domain>/... -count=1 -v` |
| Vet/fmt | `go vet ./...`, `gofmt -l internal/` (must be empty) |
| Mocks | `make mocks` |
| Contracts | `make contracts` |
| Migrations | goose SQL is the **only** schema mechanism — never auto-apply from models. New: `make migration-create name=...`; apply/rollback: `make migration-up` / `migration-down` (`DATABASE_URL`). While a schema area is **unfrozen** (pre-deploy), edit existing migrations in place; create new ones only after it is deployed |
| Swagger | `make swagger` (`swag init -g cmd/server/main.go`) |
