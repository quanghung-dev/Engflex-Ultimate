import type { Level } from "@engflex/contracts";

export type AdminRole = "admin" | "user";
export type AdminUserStatus = "active" | "suspended";

/**
 * Fixture-only: the API has no user-listing endpoint yet, so there is no wire
 * contract to import. `id` is the Clerk subject (no users table), `role`
 * mirrors the `public_metadata.role` claim, `level` the profile preference.
 */
export interface AdminUser {
	id: string;
	name: string;
	email: string;
	role: AdminRole;
	status: AdminUserStatus;
	level: Level;
	joinedAt: string;
	lastActiveAt: string;
}
