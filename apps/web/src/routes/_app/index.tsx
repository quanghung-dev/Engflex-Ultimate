import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";

export const Route = createFileRoute("/_app/")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<div className="container-content py-8">
			<PageHeader title="Dashboard" subtitle="Screen arrives with Spec 2" />
		</div>
	);
}
