/**
 * The Clerk session token carries the caller's role as a TOP-LEVEL `role`
 * claim (session token template `{"role": "{{user.public_metadata.role}}"}`),
 * which is exactly what Go's `middleware.RequireAdmin` reads. Strict allowlist
 * like `parseRole`: only the literal "admin" counts, anything else is a user.
 * Kept out of `auth-guard.ts` so client components can import it without
 * pulling in the Clerk server entry.
 */
export const ADMIN_ROLE = "admin";

declare global {
	// Clerk's documented hook for typing custom claims on `sessionClaims`.
	interface CustomJwtSessionClaims {
		role?: string;
	}
}

export function isAdminClaims(
	claims: CustomJwtSessionClaims | null | undefined,
): boolean {
	return claims?.role === ADMIN_ROLE;
}
