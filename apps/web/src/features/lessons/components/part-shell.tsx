import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { CefrBadge } from "#/components/common/cefr-badge";
import { getLessonDetail } from "#/features/lessons/fixtures";
import { type LessonPart, PART_META } from "#/features/lessons/parts";
import { m } from "#/paraglide/messages";
import { LessonStepNavigator } from "./lesson-step-navigator";

/** Unified shell for all four practice screens (the mocks were inconsistent). */
export function PartShell({
	lessonId,
	part,
	children,
}: {
	lessonId: string;
	part: LessonPart;
	children: ReactNode;
}) {
	const detail = getLessonDetail(lessonId);
	if (!detail) return null;

	const activity = detail.activities.find((item) => item.type === part);
	const partNumber = activity?.partNumber ?? 1;
	const meta = PART_META[part];

	return (
		<div className="container-content flex flex-col gap-5 py-8">
			<div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
				<div className="flex flex-col gap-2">
					<Link
						to="/lessons/$lessonId"
						params={{ lessonId }}
						className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-primary"
					>
						<ArrowLeft className="size-3.5" />
						{m["lessons.backToLesson"]()}
					</Link>
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							{m["lessons.partCounter"]({
								number: partNumber,
								total: detail.lesson.partCount,
								part: meta.label(),
							})}
						</span>
						<CefrBadge value={detail.lesson.cefrLevel} />
					</div>
					<span className="text-sm font-bold text-foreground">
						{detail.lesson.title}
					</span>
				</div>
				<LessonStepNavigator
					lessonId={lessonId}
					activities={detail.activities}
					currentPart={part}
				/>
			</div>
			{children}
		</div>
	);
}
