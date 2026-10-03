import type { Lesson, LessonProgress } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { BookmarkCheck, BookmarkPlus, Clock3, Layers } from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { CefrBadge } from "#/components/common/cefr-badge";
import { MoMascot } from "#/components/common/mo-mascot";
import { Button } from "#/components/ui/button";
import { type LessonPart, PART_META } from "#/features/lessons/parts";
import { m } from "#/paraglide/messages";

export function LessonHeader({
	lesson,
	progress,
	startPart,
	startPartNumber,
	outcomes,
	onToggleBookmark,
}: {
	lesson: Lesson;
	progress: LessonProgress;
	startPart: LessonPart;
	startPartNumber: number;
	outcomes: string[];
	onToggleBookmark: () => void;
}) {
	return (
		<section className="surface-hero flex flex-col gap-5 p-5 md:flex-row md:p-6">
			<div className="flex min-w-0 flex-1 flex-col gap-4">
				<div className="flex flex-wrap items-center gap-2">
					<CefrBadge value={lesson.cefrLevel} />
					<span className="chip px-2 py-0.5 text-xs">
						<Clock3 className="size-3.5" />
						{m["lessons.card.estDuration"]({
							minutes: lesson.details.estimatedDurationMin ?? 0,
						})}
					</span>
					<span className="chip px-2 py-0.5 text-xs">
						<Layers className="size-3.5" />
						{m["lessons.card.activitiesCount"]({ count: lesson.partCount })}
					</span>
				</div>
				<div>
					<h1 className="text-[28px] leading-[36px] font-bold text-foreground md:text-[38px] md:leading-[46px]">
						{lesson.title}
					</h1>
					<p className="mt-2 max-w-2xl text-[15px] leading-[22px] font-medium text-muted-foreground">
						{lesson.description}
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button asChild className="btn btn-primary">
						<Link
							to={APP_ROUTES.LESSONS.PART}
							params={{ lessonId: lesson.id, part: startPart }}
						>
							{m["lessons.detail.startLesson"]({
								number: startPartNumber,
								part: PART_META[startPart].label(),
							})}
						</Link>
					</Button>
					<Button
						type="button"
						variant="outline"
						className="btn btn-outline"
						onClick={onToggleBookmark}
					>
						{progress.bookmarked ? (
							<BookmarkCheck data-icon="inline-start" />
						) : (
							<BookmarkPlus data-icon="inline-start" />
						)}
						{progress.bookmarked
							? m["lessons.detail.saved"]()
							: m["lessons.detail.saveLater"]()}
					</Button>
				</div>
				<div className="border-t-2 border-border pt-4">
					<h2 className="text-sm font-bold text-foreground">
						{m["lessons.detail.outcomesTitle"]()}
					</h2>
					<ul className="mt-2 flex flex-col gap-2">
						{outcomes.map((outcome) => (
							<li
								key={outcome}
								className="flex gap-2 text-[15px] font-medium text-muted-foreground"
							>
								<span
									aria-hidden="true"
									className="mt-[9px] size-1.5 shrink-0 rounded-full bg-primary"
								/>
								<span>{outcome}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
			<div className="flex shrink-0 items-start justify-center">
				<div
					className="flex w-44 flex-col items-center gap-2 p-4"
					style={{
						background: "#ffe2c5",
						border: "2px solid var(--border)",
						borderRadius: 24,
						boxShadow: "0 5px 0 var(--border)",
					}}
				>
					<MoMascot variant="cheer" size={112} />
					<span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
						{m["lessons.detail.coach"]()}
					</span>
					<span className="text-xs font-bold text-foreground">
						{m["lessons.detail.steady"]()}
					</span>
				</div>
			</div>
		</section>
	);
}
