import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({
	component: SignInPage,
});

function SignInPage() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-background p-6">
			<SignIn />
		</div>
	);
}
