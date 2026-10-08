import { RedirectToSignIn, Show } from "@clerk/tanstack-react-start";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb } from "#/app/breadcrumbs";
import { RouteErrorFallback } from "#/components/common/error-pages";
import { AdminShell } from "#/features/admin/components/admin-shell";
import { getAuthState } from "#/lib/auth-guard";
import { m } from "#/paraglide/messages";

/**
 * Back-office layout. Same server probe as `_app`, plus the Clerk `role`
 * claim: a signed-in non-admin is sent home rather than shown a 403, since
 * there is nothing for them here. The API enforces the claim independently
 * (`RequireAdmin`), so this guard is UX, not the security boundary.
 */
// TEMP (local UI testing): `VITE_ADMIN_DEV_BYPASS=true pnpm dev` opens /admin
// without a Clerk admin session. `import.meta.env.DEV` is false in any build,
// so this can never ship. Remove once a dev admin account exists.
const DEV_BYPASS =
	import.meta.env.DEV && import.meta.env.VITE_ADMIN_DEV_BYPASS === "true";

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		if (DEV_BYPASS) return;
		const { isAuthenticated, isAdmin } = await getAuthState();
		if (!isAuthenticated) {
			throw redirect({ href: APP_ROUTES.AUTH.SIGN_IN });
		}
		if (!isAdmin) {
			throw redirect({ to: APP_ROUTES.HOME });
		}
	},
	staticData: breadcrumb({
		label: () => m["admin.shell.crumb"](),
		target: { to: APP_ROUTES.ADMIN.OVERVIEW },
	}),
	component: AdminLayout,
	errorComponent: RouteErrorFallback,
});

function AdminLayout() {
	if (DEV_BYPASS) {
		return (
			<AdminShell>
				<Outlet />
			</AdminShell>
		);
	}
	return (
		<>
			<Show when="signed-in">
				<AdminShell>
					<Outlet />
				</AdminShell>
			</Show>
			<Show when="signed-out">
				<RedirectToSignIn />
			</Show>
		</>
	);
}
