import type { ReactNode } from "react";
import { CefrBadge } from "#/components/common/cefr-badge";
import { PageLayout } from "#/components/common/page-layout";
import { getLessonDetail, LESSON_META } from "#/features/lessons/fixtures";
import type { LessonPart } from "#/features/lessons/parts";
import { LessonStepNavigator } from "./lesson-step-navigator";

/** Stitch practice shell: step pills + level/unit meta, no header card. */
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
	const meta = LESSON_META[lessonId];

	return (
		<PageLayout>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<LessonStepNavigator
					lessonId={lessonId}
					activities={detail.activities}
					currentPart={part}
				/>
				<span className="chip px-3 py-1 text-xs">
					<CefrBadge value={detail.lesson.cefrLevel} />
					{meta ? <span>· Unit {meta.slot}</span> : null}
				</span>
			</div>
			{children}
		</PageLayout>
	);
}
