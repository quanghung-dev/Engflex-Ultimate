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
import {
	lessonDetailBySlugQueryOptions,
	useLessonDetailBySlug,
} from "#/features/lessons/queries";
import {
	getFirstIncompleteActivity,
	lessonsStore,
	progressFrom,
	toggleBookmark,
} from "#/features/lessons/store";
import { loadOr404 } from "#/lib/route-loader";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/lessons/$slug/")({
	// Preload here (not in the component): loader notFound() renders the
	// route's notFoundComponent; the same throw during render escapes down
	// the error-boundary path. Non-empty activities are enforced here too,
	// so the component never throws for missing data.
	loader: async ({ context: { queryClient }, params: { slug } }) => {
		const detail = await loadOr404(
			queryClient,
			lessonDetailBySlugQueryOptions(slug),
		);
		if (detail.activities.length === 0) throw notFound();
	},
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
	// A failed fetch is an error, not a missing lesson (see loader above:
	// genuine 404s and empty lessons never reach the component).
	if (detailQuery.isError) throw detailQuery.error;
	if (!detail) return null;

	const progress = progressFrom(
		storeState,
		detail.id,
		detail.activities.length,
	);
	const startActivity = getFirstIncompleteActivity(
		detail.id,
		detail.activities,
	);
	// Unreachable: the loader enforces non-empty activities, and the lookup
	// falls back to the first activity. Kept for type narrowing only.
	if (!startActivity) return null;

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
