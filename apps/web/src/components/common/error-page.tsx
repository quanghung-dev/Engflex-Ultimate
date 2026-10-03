import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
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

/**
 * The one error surface. Every status page passes its own copy, so no
 * status-specific string is baked in here. Rendered bare — deliberately
 * outside AppShell — because /not-found and /error must also render for
 * signed-out visitors, who never get an AppShell.
 */
export function ErrorPage({
	title,
	body,
	action,
}: {
	title: string;
	body: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
			<Empty className="rounded-xl border bg-card">
				<EmptyHeader>
					<EmptyTitle>{title}</EmptyTitle>
					<EmptyDescription>{body}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					{action ?? (
						<Button asChild>
							<Link to={APP_ROUTES.HOME}>{m["common.actions.backHome"]()}</Link>
						</Button>
					)}
				</EmptyContent>
			</Empty>
		</div>
	);
}
