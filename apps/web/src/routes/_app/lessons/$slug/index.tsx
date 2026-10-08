import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { ArrowLeft, Gauge } from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { PageLayout } from "#/components/common/page-layout";
import { Button } from "#/components/ui/button";
import { ActivityRow } from "#/features/lessons/components/activity-row";
import { LessonHeader } from "#/features/lessons/components/lesson-header";
import { TipBar } from "#/features/lessons/components/tip-bar";
import { useLessonDetailBySlug } from "#/features/lessons/queries";
import {
	getFirstIncompleteActivity,
	lessonsStore,
	progressFrom,
	toggleBookmark,
} from "#/features/lessons/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/lessons/$slug/")({
	component: LessonDetailPage,
});

function LessonDetailPage() {
	const { slug } = Route.useParams();
	const detailQuery = useLessonDetailBySlug(slug);
	const detail = detailQuery.data;
	const storeState = useStore(lessonsStore);
	useBreadcrumbs(
		detail
			? [
					{ label: m["nav.item.lessons"](), to: APP_ROUTES.LESSONS.LIST },
					{ label: detail.title },
				]
			: [],
	);

	if (detailQuery.isPending) return null;
	if (!detail) throw notFound();

	const progress = progressFrom(
		storeState,
		detail.id,
		detail.activities.length,
	);
	const startActivity = getFirstIncompleteActivity(
		detail.id,
		detail.activities,
	);
	if (!startActivity) throw notFound();

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
				startPart={startActivity.type}
				startPartNumber={startActivity.partNumber}
				onToggleBookmark={() => toggleBookmark(detail.id)}
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
							slug={detail.slug}
							activity={activity}
						/>
					))}
				</div>
			</section>

			<TipBar tip={m["lessons.detail.calmQuote"]()} />
		</PageLayout>
	);
}
