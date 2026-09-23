import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";

export const Route = createFileRoute("/_app/voice/")({
	component: VoiceModesPage,
});

function VoiceModesPage() {
	return (
		<div className="container-content py-8">
			<PageHeader title="Voice modes" subtitle="Screen arrives with Spec 2" />
		</div>
	);
}
