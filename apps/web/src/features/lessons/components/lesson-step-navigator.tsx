import type { Activity } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { cn } from "cn";
import { CircleCheck } from "lucide-react";
import { type LessonPart, PART_META } from "#/features/lessons/parts";
import { lessonsStore } from "#/features/lessons/store";
import { m } from "#/paraglide/messages";

export function LessonStepNavigator({
	lessonId,
	activities,
	currentPart,
}: {
	lessonId: string;
	activities: Activity[];
	currentPart: LessonPart;
}) {
	const completed = useStore(
		lessonsStore,
		(state) => state.completedParts[lessonId] ?? [],
	);

	return (
		<nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
			{activities.map((activity) => {
				const part = activity.type as LessonPart;
				const done = completed.includes(activity.partNumber);
				const active = part === currentPart;
				const meta = PART_META[part];
				const Icon = meta.icon;
				return (
					<Link
						key={activity.id}
						to="/lessons/$lessonId/parts/$part"
						params={{ lessonId, part }}
						className={cn(
							"flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition",
							active
								? "border-primary bg-secondary text-primary"
								: "border-border bg-card text-muted-foreground hover:border-primary/40",
						)}
					>
						{done ? (
							<CircleCheck className="size-4 shrink-0 text-accuracy" />
						) : (
							<Icon className="size-4 shrink-0" />
						)}
						<span className="truncate font-semibold">
							{activity.partNumber}. {meta.label()}
						</span>
						<span className="ml-auto shrink-0 text-[11px]">
							{done
								? m["lessons.stepDone"]()
								: active
									? m["lessons.stepActive"]()
									: m["lessons.stepUpcoming"]()}
						</span>
					</Link>
				);
			})}
		</nav>
	);
}
