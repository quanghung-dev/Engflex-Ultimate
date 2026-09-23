import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";

export const Route = createFileRoute("/_app/vocabulary/")({
	component: VocabularyPage,
});

function VocabularyPage() {
	return (
		<div className="container-content py-8">
			<PageHeader title="Vocabulary" subtitle="Screen arrives with Spec 2" />
		</div>
	);
}
