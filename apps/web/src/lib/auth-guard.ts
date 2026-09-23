import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

/**
 * Server-side auth probe for route `beforeLoad` guards.
 * Clerk's `<Show>` only controls what renders (SSR would return 200 and could
 * flash blank); probing `auth()` lets the guard issue a real redirect.
 */
export const getAuthState = createServerFn().handler(async () => {
	const { isAuthenticated } = await auth();
	return { isAuthenticated };
});
