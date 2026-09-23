import { RedirectToSignIn, Show } from "@clerk/tanstack-react-start";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";
import { getAuthState } from "#/lib/auth-guard";

export const Route = createFileRoute("/onboarding")({
	beforeLoad: async () => {
		const { isAuthenticated } = await getAuthState();
		if (!isAuthenticated) {
			throw redirect({ href: "/sign-in" });
		}
	},
	component: OnboardingPage,
});

function OnboardingPage() {
	return (
		<>
			<Show when="signed-in">
				<div className="grid-bg min-h-svh">
					<div className="container-narrow py-10">
						<PageHeader title="Onboarding" />
					</div>
				</div>
			</Show>
			<Show when="signed-out">
				<RedirectToSignIn />
			</Show>
		</>
	);
}
