import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";

export const Route = createFileRoute("/_app/voice/scenarios")({
	component: ScenariosPage,
});

function ScenariosPage() {
	return (
		<div className="container-content py-8">
			<PageHeader title="Scenarios" subtitle="Screen arrives with Spec 2" />
		</div>
	);
}
