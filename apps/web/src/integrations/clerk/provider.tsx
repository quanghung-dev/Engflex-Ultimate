import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { useEffect } from "react";
import { registerTokenGetter } from "#/lib/auth-token";

export default function AppClerkProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider>
			<TokenBridge />
			{children}
		</ClerkProvider>
	);
}

/**
 * Bridges Clerk's session token to non-component call sites (`lib/api.ts`).
 * Clerk's documented external-API pattern: `await getToken()` → Bearer token.
 */
function TokenBridge() {
	const { getToken } = useAuth();

	useEffect(() => {
		registerTokenGetter(() => getToken());
		return () => registerTokenGetter(null);
	}, [getToken]);

	return null;
}
