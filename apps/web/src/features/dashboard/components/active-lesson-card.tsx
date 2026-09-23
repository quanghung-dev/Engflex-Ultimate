import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { ArrowRight } from "lucide-react";
import { ProgressBar } from "#/components/common/progress-bar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { ACTIVE_LESSON_ID } from "#/features/dashboard/fixtures";
import { getLessonById } from "#/features/lessons/fixtures";
import { lessonsStore, progressFrom } from "#/features/lessons/store";
import { m } from "#/paraglide/messages";

export function ActiveLessonCard() {
	const lesson = getLessonById(ACTIVE_LESSON_ID);
	const progress = useStore(lessonsStore, (state) =>
		progressFrom(state, ACTIVE_LESSON_ID),
	);

	if (!lesson) return null;

	return (
		<div className="energy-card h-full">
			<div className="energy-card-inner flex h-full flex-col gap-4 p-5">
				<Badge variant="outline" className="w-fit">
					{m["dashboard.unitLabel"]()}
				</Badge>
				<div>
					<h3 className="text-lg font-extrabold tracking-tight text-foreground">
						{lesson.title}
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
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
				<Button asChild className="w-fit">
					<Link to="/lessons/$lessonId" params={{ lessonId: lesson.id }}>
						{m["dashboard.activeLesson.continue"]()}
						<ArrowRight data-icon="inline-end" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
