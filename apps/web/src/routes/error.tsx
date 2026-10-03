import { createFileRoute } from "@tanstack/react-router";
import { ErrorPage } from "#/components/common/error-page";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/error")({
	component: () => (
		<ErrorPage
			title={m["errors.server.title"]()}
			body={m["errors.server.body"]()}
		/>
	),
});
