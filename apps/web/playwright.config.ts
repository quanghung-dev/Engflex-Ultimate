import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";

// Playwright runs in Node and never loads dotenv files on its own (and Vite
// only exposes VITE_*-prefixed vars to the browser anyway), so pull
// apps/web/.env.local + .env in here. Shell env wins: existing entries are
// never overwritten.
for (const [key, value] of Object.entries(
	loadEnv("development", process.cwd(), ""),
)) {
	process.env[key] ??= value;
}
// @clerk/testing wants the unprefixed name; the app uses the VITE_ one.
process.env.CLERK_PUBLISHABLE_KEY ??= process.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * E2E against a live backend (Go API + Postgres). The voice engine is
 * intentionally NOT started: VOICE_SERVICE_URL points at a dead port so
 * setup-failure paths are deterministic.
 *
 * Required env (see e2e/README.md):
 *   DATABASE_URL              Postgres DSN (also used for test seeding)
 *   CLERK_SECRET_KEY          same Clerk instance as the apps
 *   CLERK_PUBLISHABLE_KEY     or VITE_CLERK_PUBLISHABLE_KEY
 *   E2E_CLERK_USER_EMAIL      pre-created test user (…+clerk_test@… suffix)
 *   DB_*                      picked up by apps/api/docker-compose.yaml
 */
const ENSURE_E2E_DB = path.join(import.meta.dirname, "e2e/ensure-e2e-db.mjs");
const API_PORT = Number(process.env.E2E_API_PORT ?? 8000);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3000);

// The Go server reads DB_* parts (not DATABASE_URL), so derive them from the
// single e2e DATABASE_URL. Tests run against a dedicated database — never
// the dev one — created by global setup.
function e2eDbParts(): Record<string, string> {
	const raw = process.env.DATABASE_URL;
	if (!raw) return {};
	const url = new URL(raw);
	return {
		DB_HOST: url.hostname,
		DB_PORT: url.port || "5432",
		DB_USER: decodeURIComponent(url.username),
		DB_PASSWORD: decodeURIComponent(url.password),
		DB_NAME: url.pathname.replace(/^\//, ""),
		DB_SSLMODE: url.searchParams.get("sslmode") ?? "disable",
	};
}

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: `http://localhost:${WEB_PORT}`,
		trace: "retain-on-failure",
	},
	projects: [
		{ name: "global setup", testMatch: /global\.setup\.ts/ },
		{
			name: "voice",
			testMatch: /voice-room\.spec\.ts/,
			dependencies: ["global setup"],
			use: {
				...devices["Desktop Chrome"],
				storageState: "playwright/.clerk/user.json",
				launchOptions: {
					args: [
						"--use-fake-device-for-media-stream",
						"--use-fake-ui-for-media-stream",
					],
				},
			},
		},
	],
	webServer: [
		{
			// The API cannot boot without its database, and webServers start
			// before every setup hook — so create/migrate it right here.
			command: `node ${ENSURE_E2E_DB} && go run ./cmd/server`,
			cwd: "../api",
			url: `http://localhost:${API_PORT}/healthz`,
			reuseExistingServer: true,
			timeout: 60_000,
			env: {
				PORT: String(API_PORT),
				...e2eDbParts(),
				VOICE_SERVICE_URL: "http://127.0.0.1:9",
				VOICE_START_TIMEOUT_MS: "3000",
				VOICE_OFFER_TIMEOUT_MS: "3000",
				VOICE_ANALYZE_TIMEOUT_MS: "10000",
			},
		},
		{
			command: `pnpm dev --port ${WEB_PORT}`,
			url: `http://localhost:${WEB_PORT}`,
			reuseExistingServer: true,
			timeout: 120_000,
		},
	],
});
