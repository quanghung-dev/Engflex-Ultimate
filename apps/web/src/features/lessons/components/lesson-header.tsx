import type { Lesson, LessonProgress } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { CefrBadge } from "#/components/common/cefr-badge";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { type LessonPart, PART_META } from "#/features/lessons/parts";
import { m } from "#/paraglide/messages";

export function LessonHeader({
	lesson,
	progress,
	startPart,
	startPartNumber,
	onToggleBookmark,
}: {
	lesson: Lesson;
	progress: LessonProgress;
	startPart: LessonPart;
	startPartNumber: number;
	onToggleBookmark: () => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="outline" className="text-xs">
					{m["lessons.levelBadge"]({ level: lesson.cefrLevel })}
				</Badge>
				<span className="text-xs font-medium text-muted-foreground">
					{lesson.category?.name}
				</span>
				<CefrBadge value={lesson.cefrLevel} />
			</div>
			<h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-foreground md:text-[32px]">
				{lesson.title}
			</h1>
			<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
				<span>
					{m["lessons.estDuration"]({
						minutes: lesson.details.estimatedDurationMin ?? 0,
					})}
				</span>
				<span aria-hidden="true">·</span>
				<span>{m["lessons.activitiesCount"]({ count: lesson.partCount })}</span>
				<span aria-hidden="true">·</span>
				<span>{m["lessons.completedPct"]({ pct: progress.percent })}</span>
			</div>
			<p className="max-w-3xl text-sm text-muted-foreground">
				{lesson.description}
			</p>
			<div className="flex flex-wrap gap-3">
				<Button asChild>
					<Link
						to="/lessons/$lessonId/parts/$part"
						params={{ lessonId: lesson.id, part: startPart }}
					>
						{m["lessons.startLesson"]({
							number: startPartNumber,
							part: PART_META[startPart].label(),
						})}
						<ArrowRight data-icon="inline-end" />
					</Link>
				</Button>
				<Button type="button" variant="outline" onClick={onToggleBookmark}>
					{progress.bookmarked ? (
						<BookmarkCheck data-icon="inline-start" />
					) : (
						<BookmarkPlus data-icon="inline-start" />
					)}
					{progress.bookmarked
						? m["lessons.saved"]()
						: m["lessons.saveLater"]()}
				</Button>
			</div>
		</div>
	);
}
