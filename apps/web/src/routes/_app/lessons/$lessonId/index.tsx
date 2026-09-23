import { createFileRoute, redirect } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb, lessonCrumbLabel } from "#/app/breadcrumbs";
import { AcousticTargetCard } from "#/features/lessons/components/acoustic-target-card";
import { ActivityRow } from "#/features/lessons/components/activity-row";
import { LessonHeader } from "#/features/lessons/components/lesson-header";
import { OutcomesCard } from "#/features/lessons/components/outcomes-card";
import { TipBar } from "#/features/lessons/components/tip-bar";
import { VisualAnchor } from "#/features/lessons/components/visual-anchor";
import { getLessonById, getLessonDetail } from "#/features/lessons/fixtures";
import { LESSON_PART_TYPES } from "#/features/lessons/parts";
import {
	getFirstIncompletePart,
	lessonsStore,
	progressFrom,
	toggleBookmark,
} from "#/features/lessons/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/lessons/$lessonId/")({
	staticData: breadcrumb([
		{ label: () => m["nav.lessons"](), target: { to: APP_ROUTES.LESSONS } },
		lessonCrumbLabel,
	]),
	beforeLoad: ({ params }) => {
		if (!getLessonById(params.lessonId)) {
			throw redirect({ to: "/lessons" });
		}
	},
	component: LessonDetailPage,
});

const SCENARIO_CONTEXT_CAPTION = () => m["lessons.caption"]();

const VOICE_TIP = () => m["lessons.voiceTip"]();

function LessonDetailPage() {
	const { lessonId } = Route.useParams();
	const detail = getLessonDetail(lessonId);
	const progress = useStore(lessonsStore, (state) =>
		progressFrom(state, lessonId),
	);

	if (!detail) return null;

	const startPart = getFirstIncompletePart(lessonId);
	const startPartNumber = LESSON_PART_TYPES.indexOf(startPart) + 1;

	return (
		<div className="container-detail flex flex-col gap-6 py-8">
			<LessonHeader
				lesson={detail.lesson}
				progress={progress}
				startPart={startPart}
				startPartNumber={startPartNumber}
				onToggleBookmark={() => toggleBookmark(lessonId)}
			/>

			<div className="grid gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<VisualAnchor
						coverImageUrl={detail.lesson.details.coverImageUrl}
						caption={SCENARIO_CONTEXT_CAPTION()}
					/>
				</div>
				<AcousticTargetCard
					targetPct={detail.lesson.details.acousticTargetPct ?? 85}
					completionPct={progress.percent}
					cefrLevel={detail.lesson.cefrLevel}
				/>
			</div>

			<OutcomesCard outcomes={detail.outcomes} />

			<section className="flex flex-col gap-3">
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-bold tracking-tight text-foreground">
						{m["lessons.activitiesTitle"]()}
					</h2>
					<p className="text-xs text-muted-foreground">
						{m["lessons.activitiesSubtitle"]()}
					</p>
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

			<TipBar tip={VOICE_TIP()} />
		</div>
	);
}
