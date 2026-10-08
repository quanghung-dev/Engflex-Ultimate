import { createFileRoute } from "@tanstack/react-router";
import { AdminOverview } from "#/features/admin/components/admin-overview";
import { AdminPage } from "#/features/admin/components/admin-page";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/admin/")({
	component: AdminOverviewPage,
});

function AdminOverviewPage() {
	return (
		<AdminPage
			title={m["admin.overview.title"]()}
			subtitle={m["admin.overview.subtitle"]()}
		>
			<AdminOverview />
		</AdminPage>
	);
}
