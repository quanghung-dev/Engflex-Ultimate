import { getLocale } from "#/paraglide/runtime";

/** Resolved at render so a locale switch re-formats without a reload. */
export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat(getLocale(), {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(iso));
}

/** Seconds as m:ss — the video and scenario durations are stored in seconds. */
export function formatDuration(totalSeconds: number): string {
	const seconds = Math.max(0, Math.round(totalSeconds));
	const minutes = Math.floor(seconds / 60);
	return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Client-side slug default for mock creates; the API owns real slugs. */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
