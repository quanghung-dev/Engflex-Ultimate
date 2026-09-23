import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";

export const Route = createFileRoute("/_app/lessons/")({
	component: LessonsPage,
});

function LessonsPage() {
	return (
		<div className="container-content py-8">
			<PageHeader title="Lessons" subtitle="Screen arrives with Spec 2" />
		</div>
	);
}
