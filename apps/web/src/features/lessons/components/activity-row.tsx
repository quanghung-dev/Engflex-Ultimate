import type { Activity } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock3 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { type LessonPart, PART_META } from "#/features/lessons/parts";
import { m } from "#/paraglide/messages";

export function ActivityRow({
	lessonId,
	activity,
}: {
	lessonId: string;
	activity: Activity;
}) {
	const meta = PART_META[activity.type as LessonPart];
	const Icon = meta.icon;
	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
			<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
				<Icon className="size-5" />
			</span>
			<div className="flex min-w-0 flex-col gap-1">
				<h3 className="text-sm font-bold tracking-tight text-foreground">
					{m["lessons.activityTitle"]({
						number: activity.partNumber,
						title: activity.title,
					})}
				</h3>
				<p className="text-xs text-muted-foreground">{activity.description}</p>
				<div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
					<span className="inline-flex items-center gap-1">
						<Clock3 className="size-3" />
						{m["lessons.activityDuration"]({ minutes: activity.durationMin })}
					</span>
					<span aria-hidden="true">·</span>
					<span>{activity.skillFocus}</span>
				</div>
			</div>
			<Button asChild variant="outline" size="sm" className="sm:ml-auto">
				<Link
					to="/lessons/$lessonId/parts/$part"
					params={{ lessonId, part: activity.type }}
				>
					{m["lessons.start"]()}
					<ArrowRight data-icon="inline-end" />
				</Link>
			</Button>
		</div>
	);
}
