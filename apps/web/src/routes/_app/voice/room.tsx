import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";

export const Route = createFileRoute("/_app/voice/room")({
	component: LiveStudioPage,
});

function LiveStudioPage() {
	return (
		<div className="container-content py-8">
			<PageHeader title="Live studio" subtitle="Screen arrives with Spec 2" />
		</div>
	);
}
