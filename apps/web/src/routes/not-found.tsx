import { createFileRoute } from "@tanstack/react-router";
import { ErrorPage } from "#/components/common/error-page";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/not-found")({
	component: () => (
		<ErrorPage
			title={m["errors.notFound.title"]()}
			body={m["errors.notFound.body"]()}
		/>
	),
});
