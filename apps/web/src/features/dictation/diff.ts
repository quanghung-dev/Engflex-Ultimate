export type TokenDiff = { text: string; status: "match" | "diff" };

const normalize = (value: string) =>
	value.toLowerCase().replace(/[^a-z0-9' ]/g, "");

/** Best-effort word diff (no server): token-by-token, punctuation/case-insensitive. */
export function diffTokens(typed: string, reference: string): TokenDiff[] {
	const typedTokens = typed.trim().split(/\s+/).filter(Boolean);
	const refNormalized = new Set(
		reference.trim().split(/\s+/).filter(Boolean).map(normalize),
	);
	return typedTokens.map((text) => ({
		text,
		status: refNormalized.has(normalize(text)) ? "match" : "diff",
	}));
}
