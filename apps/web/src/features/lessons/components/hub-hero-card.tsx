import type { Lesson, LessonProgress } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { APP_ROUTES } from "#/app/app-route";
import { MoMascot } from "#/components/common/mo-mascot";
import { ProgressBar } from "#/components/common/progress-bar";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export function HubHeroCard({
	unit,
	unitTitle,
	lessons,
	progressById,
	resumeId,
	resumeSlot,
}: {
	unit: number;
	unitTitle: string;
	lessons: Lesson[];
	progressById: Record<string, LessonProgress>;
	resumeId: string;
	resumeSlot: string;
}) {
	const totalParts = lessons.reduce(
		(sum, lesson) => sum + (progressById[lesson.id]?.partsTotal ?? 0),
		0,
	);
	const doneParts = lessons.reduce(
		(sum, lesson) => sum + (progressById[lesson.id]?.partsCompleted ?? 0),
		0,
	);
	const percent =
		totalParts === 0 ? 0 : Math.round((doneParts / totalParts) * 100);

	return (
		<section className="surface-hero flex flex-col gap-5 p-5 md:flex-row">
			<div className="flex min-w-0 flex-1 flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="chip border-cefr-b1-border bg-cefr-b1-bg px-2 py-0.5 text-xs text-cefr-b1">
						{m["lessons.hub.inFlight"]()}
					</span>
					<span className="text-xs font-bold text-muted-foreground">
						{m["lessons.unit.label"]({ n: unit })}
					</span>
				</div>
				<h2 className="text-xl font-bold text-foreground md:text-2xl">
					{unitTitle}
				</h2>
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between text-xs">
						<span className="font-bold text-foreground">
							{m["lessons.hub.overall"]()}
						</span>
						<span className="font-bold text-primary">{percent}%</span>
					</div>
					<ProgressBar value={percent} />
				</div>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
					{lessons.map((lesson) => {
						const progress = progressById[lesson.id];
						const dot =
							progress?.status === "completed"
								? "bg-primary"
								: progress?.status === "in_progress"
									? "bg-secondary"
									: "bg-border";
						return (
							<span
								key={lesson.id}
								className="inline-flex items-center gap-1.5"
							>
								<span className={`size-1.5 rounded-full ${dot}`} />
								{lesson.title}
							</span>
						);
					})}
				</div>
				<div>
					<Button asChild className="btn btn-primary w-fit">
						<Link
							to={APP_ROUTES.LESSONS.DETAIL}
							params={{ lessonId: resumeId }}
						>
							{m["lessons.hub.resume"]({ unit: resumeSlot })}
						</Link>
					</Button>
				</div>
			</div>
			<div className="flex shrink-0 items-center justify-center">
				<div
					className="relative hidden items-center justify-center rounded-full bg-accent sm:flex"
					style={{
						width: 112,
						height: 112,
						boxShadow: "0 3px 0 var(--border)",
					}}
				>
					<MoMascot variant="wave" size={80} />
					<span
						className="absolute -top-1 -right-1 px-2 py-0.5 text-[11px] font-bold text-foreground"
						style={{
							background: "#ffe2c5",
							borderRadius: 9999,
							boxShadow: "0 2px 0 var(--border)",
						}}
					>
						{m["lessons.hub.paced"]()}
					</span>
				</div>
			</div>
		</section>
	);
}
