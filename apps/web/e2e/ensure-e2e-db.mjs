/**
 * Prepare the e2e database before the Go API boots.
 *
 * Runs as the first half of the API's `webServer.command`
 * (`node e2e/ensure-e2e-db.mjs && go run ./cmd/server`) because Playwright
 * starts webServers *before* any setup hook — a globalSetup module or a setup
 * test project both run too late, and the API refuses to boot without its
 * database. Idempotent: existing database is kept, migrations are no-ops.
 *
 * Kept as a script rather than a TS module so it can run standalone, with cwd
 * anywhere: `pg` resolves from apps/web/node_modules, and `make` runs in
 * apps/api.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import pg from "pg";

const dsn = process.env.DATABASE_URL;
if (!dsn) {
	console.error("e2e: DATABASE_URL must be set (see e2e/README.md)");
	process.exit(1);
}

const url = new URL(dsn);
const dbName = url.pathname.replace(/^\//, "");
url.pathname = "/postgres";
const admin = new pg.Client({ connectionString: url.toString() });
await admin.connect();
try {
	await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
	console.log(`e2e: created database ${dbName}`);
} catch (error) {
	// 42P04 = duplicate_database: already exists, which is fine.
	if (error.code !== "42P04") throw error;
} finally {
	await admin.end();
}

// Real env wins over apps/api/.env, so this migrates the e2e database.
execFileSync("make", ["migration-up"], {
	cwd: path.join(import.meta.dirname, "../../api"),
	env: { ...process.env },
	stdio: "inherit",
});
