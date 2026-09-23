import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up/$")({
	component: SignUpPage,
});

function SignUpPage() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-background p-6">
			<SignUp />
		</div>
	);
}
