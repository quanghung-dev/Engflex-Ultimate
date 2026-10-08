import { createFileRoute } from "@tanstack/react-router";
import { breadcrumb } from "#/app/breadcrumbs";
import { AdminPage } from "#/features/admin/components/admin-page";
import {
	PersonasPanel,
	ScenariosPanel,
} from "#/features/admin/components/scenario-panels";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/admin/scenarios")({
	staticData: breadcrumb(() => m["admin.nav.scenarios"]()),
	component: AdminScenariosPage,
});

function AdminScenariosPage() {
	return (
		<AdminPage
			title={m["admin.scenarios.title"]()}
			subtitle={m["admin.scenarios.subtitle"]()}
			tabs={[
				{
					value: "scenarios",
					label: m["admin.scenarios.tabs.scenarios"](),
					content: <ScenariosPanel />,
				},
				{
					value: "personas",
					label: m["admin.scenarios.tabs.personas"](),
					content: <PersonasPanel />,
				},
			]}
		/>
	);
}
