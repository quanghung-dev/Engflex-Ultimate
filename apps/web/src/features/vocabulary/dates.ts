import { TODAY } from "./fixtures";

/** Deterministic "due" check: fixture dates compare against the mock's today. */
export function isDue(srsDueAt: string | undefined): boolean {
	if (!srsDueAt) return false;
	return srsDueAt.slice(0, 10) <= TODAY;
}
