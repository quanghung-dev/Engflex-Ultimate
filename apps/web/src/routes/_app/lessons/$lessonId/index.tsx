import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { ArrowLeft, Gauge } from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb, lessonCrumbLabel } from "#/app/breadcrumbs";
import { PageLayout } from "#/components/common/page-layout";
import { Button } from "#/components/ui/button";
import { ActivityRow } from "#/features/lessons/components/activity-row";
import { LessonHeader } from "#/features/lessons/components/lesson-header";
import { TipBar } from "#/features/lessons/components/tip-bar";
import { LESSON_PART_TYPES } from "#/features/lessons/parts";
import { useLessonDetail } from "#/features/lessons/queries";
import {
	getFirstIncompletePart,
	lessonsStore,
	progressFrom,
	toggleBookmark,
} from "#/features/lessons/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/lessons/$lessonId/")({
	staticData: breadcrumb([
		{
			label: () => m["nav.item.lessons"](),
			target: { to: APP_ROUTES.LESSONS.LIST },
		},
		lessonCrumbLabel,
	]),
	component: LessonDetailPage,
});

function LessonDetailPage() {
	const { lessonId } = Route.useParams();
	const detailQuery = useLessonDetail(lessonId);
	const detail = detailQuery.data;
	const storeState = useStore(lessonsStore);

	if (detailQuery.isPending) return null;
	if (!detail) throw notFound();

	const progress = progressFrom(
		storeState,
		lessonId,
		detail.activities.length,
	);
	const startPart = getFirstIncompletePart(lessonId, detail.activities.length);
	const startPartNumber = LESSON_PART_TYPES.indexOf(startPart) + 1;

	return (
		<PageLayout>
			<div className="flex flex-wrap items-center gap-2">
				<Button asChild variant="outline" size="sm" className="btn btn-outline">
					<Link to={APP_ROUTES.LESSONS.LIST}>
						<ArrowLeft data-icon="inline-start" />
						{m["lessons.detail.backToLesson"]()}
					</Link>
				</Button>
				<span className="chip px-2 py-0.5 text-xs">
					{detail.section?.title}
				</span>
				<span className="chip px-2 py-0.5 text-xs">
					{m["lessons.detail.sequential"]()}
				</span>
				<span className="chip ml-auto px-2 py-0.5 text-xs">
					<Gauge className="size-3.5" />
					{m["lessons.detail.pace"]()}
				</span>
			</div>

			<LessonHeader
				lesson={detail}
				progress={progress}
				startPart={startPart}
				startPartNumber={startPartNumber}
				onToggleBookmark={() => toggleBookmark(lessonId)}
			/>

			<section className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<h2 className="text-lg font-bold text-foreground">
						{m["lessons.detail.activitiesTitle"]()}
					</h2>
					<span className="text-xs font-bold text-muted-foreground">
						{m["lessons.detail.activitiesSubtitle"]()}
					</span>
				</div>
				<div className="flex flex-col gap-3">
					{detail.activities.map((activity) => (
						<ActivityRow
							key={activity.id}
							lessonId={lessonId}
							activity={activity}
						/>
					))}
				</div>
			</section>

			<TipBar tip={m["lessons.detail.calmQuote"]()} />
		</PageLayout>
	);
}
