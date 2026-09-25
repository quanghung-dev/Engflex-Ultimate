import { Link } from "@tanstack/react-router";
import { APP_ROUTES } from "#/app/app-route";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { m } from "#/paraglide/messages";

/** Global 404 (root notFoundComponent + thrown notFound() fallbacks). */
export function RouteNotFound() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
			<Empty className="rounded-xl border bg-card">
				<EmptyHeader>
					<EmptyTitle>{m["common.notFoundTitle"]()}</EmptyTitle>
					<EmptyDescription>{m["common.notFoundBody"]()}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button asChild>
						<Link to={APP_ROUTES.HOME}>{m["common.backHome"]()}</Link>
					</Button>
				</EmptyContent>
			</Empty>
		</div>
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
		<div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
			<Empty className="rounded-xl border bg-card">
				<EmptyHeader>
					<EmptyTitle>{m["common.errorTitle"]()}</EmptyTitle>
					<EmptyDescription>{m["common.errorBody"]()}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex flex-wrap justify-center gap-2">
						<Button type="button" onClick={() => reset()}>
							{m["common.retry"]()}
						</Button>
						<Button type="button" variant="outline" asChild>
							<Link to={APP_ROUTES.HOME}>{m["common.backHome"]()}</Link>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	);
}
