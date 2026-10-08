import { createFileRoute } from "@tanstack/react-router";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageLayout } from "#/components/common/page-layout";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/about")({
	component: About,
});

function About() {
	useBreadcrumbs([
		{ label: m["nav.item.home"](), to: APP_ROUTES.HOME },
		{ label: m["about.crumb"]() },
	]);
	return (
		<PageLayout
			hero={{
				icon: <MoMascot variant="wave" size={64} />,
				title: m["about.title"](),
				description: m["about.body"](),
			}}
		/>
	);
}
