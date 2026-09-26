import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";
import { FAKE_MIC_AUDIO } from "./e2e/fake-mic";

// Same env loading as playwright.config.ts: Playwright runs in Node and never
// reads dotenv files itself, and Vite only exposes VITE_* to the browser.
// Shell env still wins.
for (const [key, value] of Object.entries(
	loadEnv("development", process.cwd(), ""),
)) {
	process.env[key] ??= value;
}
process.env.CLERK_PUBLISHABLE_KEY ??= process.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * LIVE e2e: a real voice engine, a real session, a real Analyze round trip.
 *
 * The default suite (playwright.config.ts) points VOICE_SERVICE_URL at a dead
 * port so setup-failure paths are deterministic. This config is the opposite:
 * it boots the engine and points Go at it, so the fake mic really streams
 * through WebRTC -> Deepgram -> collector -> live turn post -> Go poll ->
 * Analyze -> engine /analyze -> diagnostics card.
 *
 * Nothing here is reused from a running dev server (`reuseExistingServer:
 * false` everywhere): a dev API on 8000 carries its own VOICE_SERVICE_URL and
 * would silently make the whole run prove nothing. Hence the dedicated ports.
 *
 * Requires the engine's own prerequisites (apps/voice/.env with real
 * DEEPGRAM/OPENAI keys + the Piper voice in models/) — see e2e/README.md.
 */
const ENSURE_E2E_DB = path.join(import.meta.dirname, "e2e/ensure-e2e-db.mjs");
const API_PORT = Number(process.env.E2E_LIVE_API_PORT ?? 8010);
const WEB_PORT = Number(process.env.E2E_LIVE_WEB_PORT ?? 3010);
const ENGINE_PORT = Number(process.env.E2E_LIVE_ENGINE_PORT ?? 7861);

// e2e/helpers.ts builds its API base URL from these (same convention as the
// default config). Workers inherit the main process env, so this is how the
// specs learn they are talking to the live stack.
process.env.E2E_API_PORT ??= String(API_PORT);
process.env.E2E_WEB_PORT ??= String(WEB_PORT);

// Go reads DB_* parts (not DATABASE_URL); the e2e database is created and
// migrated by e2e/ensure-e2e-db.mjs.
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

// Engine webServer env, factored out so the values are visible in one place.
// INTERNAL_SECRET must match VOICE_INTERNAL_SECRET below (dev value pinned
// here so a drifted .env fails loudly instead of 401-ing every callback).
const ENGINE_ENV = {
	API_URL: `http://localhost:${API_PORT}`,
	INTERNAL_SECRET: "dev-internal-secret",
	SENTRY_DSN: "",
};

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 180_000,
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: `http://localhost:${WEB_PORT}`,
		trace: "retain-on-failure",
	},
	projects: [
		{ name: "global setup", testMatch: /global\.setup\.ts/ },
		{
			name: "voice-live",
			testMatch: /voice-live\.spec\.ts/,
			dependencies: ["global setup"],
			use: {
				...devices["Desktop Chrome"],
				storageState: "playwright/.clerk/user.json",
				launchOptions: {
					args: [
						"--use-fake-ui-for-media-stream",
						// The device flag is the load-bearing one: without it
						// Chrome uses the REAL microphone and the file flag
						// below is silently ignored. Missing it cost several
						// live runs their audio — the engine transcribed the
						// room instead (TOEIC practice, narration, silence),
						// which the boundary report exposed as fluent
						// non-fixture transcripts. (--use-fake-ui only
						// auto-grants the permission prompt.)
						"--use-fake-device-for-media-stream",
						// Looped on purpose (no %noloop): the file starts
						// playing when the mic track is acquired, well before
						// the session's STT pipeline is listening — a
						// play-once file speaks into the void and the engine
						// then sits in "No audio frame received". Repetitions
						// become separate user turns (bot replies in the
						// gaps); the test analyzes the first clean one.
						`--use-file-for-fake-audio-capture=${FAKE_MIC_AUDIO}`,
					],
				},
			},
		},
	],
	webServer: [
		{
			command: `uv run src/bot.py -t webrtc --port ${ENGINE_PORT}`,
			cwd: "../voice",
			url: `http://localhost:${ENGINE_PORT}/status`,
			reuseExistingServer: false,
			timeout: 120_000,
			// Turn batches must land in the e2e API/DB, not the dev one.
			// INTERNAL_SECRET must match VOICE_INTERNAL_SECRET below (dev
			// value from apps/{api,voice}/.env, pinned here so a drifted .env
			// fails loudly instead of 401-ing every callback).
			env: { ...ENGINE_ENV },
		},
		{
			// The API cannot boot without its database, and webServers start
			// before every setup hook — so create/migrate it right here.
			command: `node ${ENSURE_E2E_DB} && go run ./cmd/server`,
			cwd: "../api",
			url: `http://localhost:${API_PORT}/healthz`,
			reuseExistingServer: false,
			timeout: 60_000,
			env: {
				PORT: String(API_PORT),
				...e2eDbParts(),
				VOICE_SERVICE_URL: `http://localhost:${ENGINE_PORT}`,
				VOICE_INTERNAL_SECRET: "dev-internal-secret",
				VOICE_START_TIMEOUT_MS: "30000",
				VOICE_OFFER_TIMEOUT_MS: "30000",
				// One LLM pass on a proxied endpoint: generous, the test
				// asserts the card, not the latency.
				VOICE_ANALYZE_TIMEOUT_MS: "90000",
			},
		},
		{
			command: `pnpm dev --port ${WEB_PORT}`,
			url: `http://localhost:${WEB_PORT}`,
			reuseExistingServer: false,
			timeout: 120_000,
			env: {
				// API_URL is the api client base, which already carries the
				// /api/v1 prefix (see .env.local) — routes are appended to it.
				VITE_API_URL: `http://localhost:${API_PORT}/api/v1`,
			},
		},
	],
});
