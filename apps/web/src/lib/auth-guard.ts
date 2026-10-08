import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { isAdminClaims } from "#/lib/roles";

/**
 * Server-side auth probe for route `beforeLoad` guards.
 * Clerk's `<Show>` only controls what renders (SSR would return 200 and could
 * flash blank); probing `auth()` lets the guard issue a real redirect.
 * `isAdmin` is UI gating only — the API enforces the same claim itself.
 */
export const getAuthState = createServerFn().handler(async () => {
	const { isAuthenticated, sessionClaims } = await auth();
	return { isAuthenticated, isAdmin: isAdminClaims(sessionClaims) };
});
