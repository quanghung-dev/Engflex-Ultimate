import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";

export const Route = createFileRoute("/_app/lessons/$lessonId/")({
	component: LessonDetailPage,
});

function LessonDetailPage() {
	return (
		<div className="container-content py-8">
			<PageHeader title="Lesson detail" subtitle="Screen arrives with Spec 2" />
		</div>
	);
}
