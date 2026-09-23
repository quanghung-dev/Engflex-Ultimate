import type { Lesson, LessonProgress } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CefrBadge } from "#/components/common/cefr-badge";
import { ProgressBar } from "#/components/common/progress-bar";
import { m } from "#/paraglide/messages";

export function LessonCard({
	lesson,
	progress,
}: {
	lesson: Lesson;
	progress: LessonProgress;
}) {
	return (
		<Link
			to="/lessons/$lessonId"
			params={{ lessonId: lesson.id }}
			className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition hover:border-primary/40 hover:bg-secondary/40"
		>
			<div className="flex items-center justify-between gap-2">
				<span className="truncate text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{lesson.category?.name}
				</span>
				<CefrBadge value={lesson.cefrLevel} />
			</div>
			<h3 className="text-base font-bold tracking-tight text-foreground">
				{lesson.title}
			</h3>
			<div className="mt-auto flex flex-col gap-2">
				<span className="text-xs text-muted-foreground">
					{m["lessons.cardMeta"]({
						minutes: lesson.details.estimatedDurationMin ?? 0,
						parts: lesson.partCount,
					})}
				</span>
				{progress.percent > 0 ? <ProgressBar value={progress.percent} /> : null}
				<span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
					{m["lessons.viewLesson"]()}
					<ArrowRight className="size-3.5" />
				</span>
			</div>
		</Link>
	);
}
