#!/usr/bin/env node
/**
 * Frontend convention guard for apps/web.
 *
 * Three checks, each guarding a failure mode that is otherwise silent:
 *
 *  1. messages — every m["<id>"] key used in src/ exists in BOTH en and vi, the
 *     en and vi key sets are identical, no id is orphaned, and every file nests
 *     under exactly one root key equal to its file name. (inlang merges all
 *     files into ONE flat namespace, so a same-named key silently overrides.)
 *  2. dynamic — every m[...] index is a plain string literal. A template literal
 *     bypasses Paraglide's generated types, so renaming that key becomes a
 *     runtime missing-message instead of a TS7053 at build time.
 *  3. routes — no hand-written file outside src/app/app-route.ts and
 *     src/app/api-routes.ts contains a literal frontend URL.
 *
 * Run from apps/web:  node scripts/check-conventions.mjs
 * Exits non-zero on any violation.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const LOCALES = ["en", "vi"];
const errors = [];

const fail = (check, message) => errors.push(`[${check}] ${message}`);
const lineOf = (text, index) => text.slice(0, index).split("\n").length;

/* ------------------------------------------------------------------ utils */

function walk(dir, skip = new Set(), out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (skip.has(entry.name)) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, skip, out);
		else out.push(full);
	}
	return out;
}

function flatten(node, prefix = "", out = new Map()) {
	for (const [key, value] of Object.entries(node)) {
		if (key === "$schema") continue;
		const id = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === "object" && !Array.isArray(value)) {
			flatten(value, id, out);
		} else {
			out.set(id, value);
		}
	}
	return out;
}

/* --------------------------------------------------------------- messages */

const messagesByLocale = new Map();
for (const locale of LOCALES) {
	const dir = path.join(root, "messages", locale);
	if (!fs.existsSync(dir)) {
		fail("messages", `messages/${locale} is missing`);
		continue;
	}
	const ids = new Map();
	for (const file of fs.readdirSync(dir).sort()) {
		if (!file.endsWith(".json")) continue;
		const json = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
		const roots = Object.keys(json).filter((key) => key !== "$schema");
		if (roots.length !== 1) {
			fail(
				"messages",
				`messages/${locale}/${file} must nest under exactly one root key, found [${roots.join(", ")}]`,
			);
			continue;
		}
		if (roots[0] !== file.replace(/\.json$/, "")) {
			fail(
				"messages",
				`messages/${locale}/${file} root key "${roots[0]}" must equal the file name`,
			);
		}
		for (const [id, value] of flatten(json)) {
			if (ids.has(id)) {
				fail(
					"messages",
					`duplicate id "${id}" in messages/${locale} (${file} collides with an earlier file)`,
				);
			}
			ids.set(id, value);
		}
	}
	messagesByLocale.set(locale, ids);
}

const en = messagesByLocale.get("en") ?? new Map();
const vi = messagesByLocale.get("vi") ?? new Map();

for (const id of en.keys()) {
	if (!vi.has(id)) fail("messages", `"${id}" exists in en but not in vi`);
}
for (const id of vi.keys()) {
	if (!en.has(id)) fail("messages", `"${id}" exists in vi but not in en`);
}

/* -------------------------------------------------------------- src scan */

const srcFiles = walk(path.join(root, "src"), new Set(["paraglide"])).filter(
	(file) => /\.tsx?$/.test(file) && !file.endsWith("routeTree.gen.ts"),
);

// The accessor is not hardcoded to `m`: a file may alias the import
// (`import { m as msg }`) or namespace-import it, and a hardcoded `m[` would
// silently stop seeing those files. Resolve the local names per file instead.
const MESSAGES_MODULE = /#\/paraglide\/messages/;

function messageAccessors(text) {
	const names = new Set();
	for (const match of text.matchAll(
		/import\s*\{([^}]*)\}\s*from\s*["'][^"']*#\/paraglide\/messages["']/g,
	)) {
		for (const part of match[1].split(",")) {
			const token = part.trim();
			if (!token) continue;
			const aliased = /^(\w+)\s+as\s+(\w+)$/.exec(token);
			names.add(aliased ? aliased[2] : token);
		}
	}
	for (const match of text.matchAll(
		/import\s*\*\s*as\s+(\w+)\s*from\s*["'][^"']*#\/paraglide\/messages["']/g,
	)) {
		names.add(match[1]);
	}
	return names;
}

// The leading lookbehind stops the accessor from matching the tail of a longer
// identifier such as `WordForm[]`. \s* spans newlines, so a key the formatter
// wrapped across lines (aria-label={m[  "some.key"  ]()}) still counts as static.
const keyPatterns = (accessors) => {
	const group = [...accessors].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
	const lead = `(?<![A-Za-z0-9_$])(?:${group})\\[`;
	return {
		// biome-ignore lint/suspicious/noMisleadingCharacterClass: alternation is intentional
		static: new RegExp(`${lead}\\s*["']([a-z][A-Za-z0-9_]*(?:\\.[A-Za-z0-9_]+)+)["']\\s*\\]`, "g"),
		dynamic: new RegExp(`${lead}(?!\\s*["'])`, "g"),
	};
};

const usedIds = new Set();
const usedDynamic = [];

for (const file of srcFiles) {
	const rel = path.relative(root, file);
	const text = fs.readFileSync(file, "utf8");
	// Only files that actually import the message catalogue are scanned, so a
	// local variable that happens to be named `m` cannot trip the checks.
	if (!MESSAGES_MODULE.test(text)) continue;
	const accessors = messageAccessors(text);
	if (accessors.size === 0) continue;
	const patterns = keyPatterns(accessors);

	for (const match of text.matchAll(patterns.static)) {
		const id = match[1];
		const at = `${rel}:${lineOf(text, match.index)}`;
		usedIds.add(id);
		if (!en.has(id)) fail("messages", `${at} uses "${id}" which is not in messages/en`);
		if (!vi.has(id)) fail("messages", `${at} uses "${id}" which is not in messages/vi`);
	}

	for (const match of text.matchAll(patterns.dynamic)) {
		const snippet = text
			.slice(match.index, match.index + 90)
			.split("\n")
			.slice(0, 3)
			.join(" ")
			.trim();
		usedDynamic.push(`${rel}:${lineOf(text, match.index)}  ${snippet}`);
	}
}

for (const id of en.keys()) {
	if (!usedIds.has(id)) fail("messages", `"${id}" is defined in messages/en but never used`);
}

/* ----------------------------------------------------------------- routes */

const ROUTE_CONSTANT_FILES = new Set([
	path.join(root, "src/app/app-route.ts"),
	path.join(root, "src/app/api-routes.ts"),
	path.join(root, "src/routeTree.gen.ts"),
]);

// Frontend path segments that must come from APP_ROUTES. Mirrors the
// top-level keys of APP_ROUTES — keep the two in step.
// Derive the watched segments from APP_ROUTES itself rather than mirroring its
// keys by hand: a hardcoded list silently stops covering any route added later,
// which is exactly the divergence this check exists to prevent. Every first
// segment of every path literal in the module becomes a watched segment.
const appRouteSrc = fs.readFileSync(
	path.join(root, "src/app/app-route.ts"),
	"utf8",
);
const routeSegments = [
	...new Set(
		[...appRouteSrc.matchAll(/["'`](\/[a-z0-9][a-z0-9-]*)/g)].map((m) => m[1]),
	),
].sort((a, b) => b.length - a.length); // longest first, so /voice never eats /vocabulary
if (routeSegments.length === 0) {
	fail("routes", "no path literals found in src/app/app-route.ts — cannot derive segments");
}
const SEGMENT_ALT = routeSegments.join("|");

// HOME is a bare "/", which cannot be matched as a plain literal without firing
// on every string containing a slash — so only flag it in a route position.
// The optional `{` covers JSX expression form: to={"/"} as well as to="/".
const BARE_ROOT = /(?:\bto|\bhref)\s*[:=]\s*\{?\s*(["'`])\/(["'`])/;

const ROUTE_LITERAL = new RegExp(`["'\`](?:${SEGMENT_ALT})[^"'\`]*["'\`]`);
// An absolute URL is just as much a hardcoded route: "https://app.host/lessons".
const ABSOLUTE_ROUTE_LITERAL = new RegExp(
	`["'\`]https?://[^"'\`]*?(?:${SEGMENT_ALT})(?:/[^"'\`]*)?["'\`]`,
);

for (const file of srcFiles) {
	if (ROUTE_CONSTANT_FILES.has(file)) continue;
	const rel = path.relative(root, file);
	fs.readFileSync(file, "utf8")
		.split("\n")
		.forEach((line, index) => {
			// Drop the route definition itself — createFileRoute("/x") is where a
			// path is supposed to be written down.
			const withoutDefinition = line.replace(
				/createFileRoute\(\s*["'`][^"'`]*["'`]\s*\)/g,
				"",
			);
			const bare = BARE_ROOT.exec(withoutDefinition);
			const literal = bare
				? `"/"`
				: (ROUTE_LITERAL.exec(withoutDefinition) ??
					ABSOLUTE_ROUTE_LITERAL.exec(withoutDefinition))?.[0];
			if (literal) {
				fail(
					"routes",
					`${rel}:${index + 1} hardcodes the URL ${literal} — use APP_ROUTES, or API_ROUTES for backend paths`,
				);
			}
		});
}

/* ----------------------------------------------------------------- report */

if (usedDynamic.length) {
	fail(
		"dynamic",
		`${usedDynamic.length} m[...] index(es) are not plain string literals, so Paraglide cannot type-check them:\n      ${usedDynamic.join("\n      ")}`,
	);
}

if (errors.length) {
	console.error(`\n✗ ${errors.length} convention violation(s):\n`);
	for (const error of errors) console.error(`  ${error}`);
	console.error("");
	process.exit(1);
}

console.log(
	`✓ conventions ok — ${en.size} message ids (en/vi identical), ${usedIds.size} referenced, 0 orphans, 0 dynamic keys, 0 hardcoded URLs`,
);
