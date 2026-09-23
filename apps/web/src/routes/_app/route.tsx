import { RedirectToSignIn, Show } from "@clerk/tanstack-react-start";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "#/components/layout/app-shell";
import { getAuthState } from "#/lib/auth-guard";

export const Route = createFileRoute("/_app")({
	beforeLoad: async () => {
		const { isAuthenticated } = await getAuthState();
		if (!isAuthenticated) {
			throw redirect({ href: "/sign-in" });
		}
	},
	component: AppLayout,
});

function AppLayout() {
	return (
		<>
			<Show when="signed-in">
				<AppShell>
					<Outlet />
				</AppShell>
			</Show>
			<Show when="signed-out">
				<RedirectToSignIn />
			</Show>
		</>
	);
}
