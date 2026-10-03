import type { Activity } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { APP_ROUTES } from "#/app/app-route";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export function ActivityRow({
	lessonId,
	activity,
}: {
	lessonId: string;
	activity: Activity;
}) {
	return (
		<div className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4">
			<span
				className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
				style={{ boxShadow: "0 3px 0 #433095" }}
			>
				{activity.partNumber}
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="text-base font-bold text-foreground">
						{activity.title}
					</h3>
					<span className="chip bg-accent px-2 py-0 text-[11px]">
						{m["lessons.card.activityDuration"]({
							minutes: activity.durationMin,
						})}
					</span>
				</div>
				<p className="text-[15px] font-medium text-muted-foreground">
					{activity.description}
				</p>
			</div>
			<Button
				asChild
				variant="outline"
				size="sm"
				className="btn btn-outline sm:ml-auto"
			>
				<Link
					to={APP_ROUTES.LESSONS.PART}
					params={{ lessonId, part: activity.type }}
				>
					{m["lessons.card.start"]()}
				</Link>
			</Button>
		</div>
	);
}
