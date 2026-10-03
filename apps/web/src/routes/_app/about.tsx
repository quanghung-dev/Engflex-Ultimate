import { createFileRoute } from "@tanstack/react-router";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb } from "#/app/breadcrumbs";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageLayout } from "#/components/common/page-layout";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/about")({
	staticData: breadcrumb([
		{ label: () => m["nav.item.home"](), target: { to: APP_ROUTES.HOME } },
		() => m["about.crumb"](),
	]),
	component: About,
});

function About() {
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
