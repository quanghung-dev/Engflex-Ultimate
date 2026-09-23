import { AsyncLocalStorage } from "node:async_hooks";
import { createMiddleware } from "@tanstack/react-start";
import {
	cookieName,
	type Locale,
	locales,
	overwriteServerAsyncLocalStorage,
} from "#/paraglide/runtime";

const localeStorage = new AsyncLocalStorage<{ locale?: Locale }>();
overwriteServerAsyncLocalStorage(localeStorage);

function localeFromCookie(header: string | null): Locale | undefined {
	if (!header) return undefined;
	for (const part of header.split(";")) {
		const eq = part.indexOf("=");
		if (eq < 0) continue;
		if (part.slice(0, eq).trim() !== cookieName) continue;
		const value = part.slice(eq + 1).trim();
		if ((locales as readonly string[]).includes(value)) {
			return value as Locale;
		}
	}
	return undefined;
}

/**
 * Per-request locale for SSR: reads the PARAGLIDE_LOCALE cookie (written by
 * setLocale with the cookie strategy) into Paraglide's server storage.
 * No cookie → baseLocale (vi) fallback inside getLocale().
 */
export const localeMiddleware = createMiddleware({ type: "request" }).server(
	({ request, next }) => {
		const locale = localeFromCookie(request.headers.get("cookie"));
		if (!locale) return next();
		return localeStorage.run({ locale }, () => next());
	},
);
