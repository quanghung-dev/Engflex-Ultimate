import { Link } from "@tanstack/react-router";
import { APP_ROUTES } from "#/app/app-route";
import { ErrorPage } from "#/components/common/error-page";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

/** Global 404 (root notFoundComponent + thrown notFound() fallbacks). */
export function RouteNotFound() {
	return (
		<ErrorPage
			title={m["errors.notFound.title"]()}
			body={m["errors.notFound.body"]()}
		/>
	);
}

/** Route error boundary fallback (unexpected render/query failures). */
export function RouteErrorFallback({
	reset,
}: {
	error: unknown;
	reset: () => void;
}) {
	return (
		<ErrorPage
			title={m["errors.server.title"]()}
			body={m["errors.server.body"]()}
			action={
				<div className="flex flex-wrap justify-center gap-2">
					<Button type="button" onClick={() => reset()}>
						{m["common.actions.retry"]()}
					</Button>
					<Button type="button" variant="outline" asChild>
						<Link to={APP_ROUTES.HOME}>{m["common.actions.backHome"]()}</Link>
					</Button>
				</div>
			}
		/>
	);
}
