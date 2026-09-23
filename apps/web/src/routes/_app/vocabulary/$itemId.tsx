import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";

export const Route = createFileRoute("/_app/vocabulary/$itemId")({
	component: WordDetailPage,
});

function WordDetailPage() {
	return (
		<div className="container-content py-8">
			<PageHeader title="Word detail" subtitle="Screen arrives with Spec 2" />
		</div>
	);
}
