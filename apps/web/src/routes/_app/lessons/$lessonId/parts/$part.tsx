import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "#/components/common/page-header";
import { isLessonPart } from "#/features/lessons/parts";

export const Route = createFileRoute("/_app/lessons/$lessonId/parts/$part")({
	beforeLoad: ({ params }) => {
		if (!isLessonPart(params.part)) {
			throw redirect({
				to: "/lessons/$lessonId",
				params: { lessonId: params.lessonId },
			});
		}
	},
	component: PracticePage,
});

function PracticePage() {
	return (
		<div className="container-content py-8">
			<PageHeader title="Practice" subtitle="Screen arrives with Spec 2" />
		</div>
	);
}
