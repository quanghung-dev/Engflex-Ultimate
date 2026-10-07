import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { APP_ROUTES } from "#/app/app-route";
import { ProgressBar } from "#/components/common/progress-bar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { useLessonSections } from "#/features/lessons/queries";
import { lessonsStore, progressFrom } from "#/features/lessons/store";
import { m } from "#/paraglide/messages";

export function ActiveLessonCard() {
	const sectionsQuery = useLessonSections();
	const units =
		sectionsQuery.data?.flatMap((section) => section.units) ?? [];
	const storeState = useStore(lessonsStore);
	const lesson =
		units.find(
			(unit) =>
				progressFrom(storeState, unit.id, unit.partCount).status ===
				"in_progress",
		) ?? units[0];
	const progress = lesson
		? progressFrom(storeState, lesson.id, lesson.partCount)
		: null;

	if (!lesson || !progress) return null;

	return (
		<div className="surface-hero flex h-full flex-col gap-4 p-5">
			<Badge variant="outline" className="chip w-fit">
				{m["dashboard.activeLesson.unitLabel"]()}
			</Badge>
			<div>
				<h3 className="text-lg font-bold text-foreground">{lesson.title}</h3>
				<p className="mt-1 text-[15px] font-medium text-muted-foreground">
					{lesson.description}
				</p>
			</div>
			<div className="mt-auto flex flex-col gap-2">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>
						{m["dashboard.activeLesson.progress"]({
							done: progress.partsCompleted,
							total: progress.partsTotal,
						})}
					</span>
					<span className="font-semibold text-foreground">
						{progress.percent}%
					</span>
				</div>
				<ProgressBar value={progress.percent} />
			</div>
			<Button asChild className="btn btn-primary w-fit">
				<Link to={APP_ROUTES.LESSONS.DETAIL} params={{ lessonId: lesson.id }}>
					{m["dashboard.activeLesson.continue"]()}
				</Link>
			</Button>
		</div>
	);
}
