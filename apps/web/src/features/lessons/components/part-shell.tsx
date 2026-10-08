import type { ActivityType } from "@engflex/contracts";
import type { ReactNode } from "react";
import { CefrBadge } from "#/components/common/cefr-badge";
import { PageLayout } from "#/components/common/page-layout";
import { useLessonDetail } from "#/features/lessons/queries";
import { LessonStepNavigator } from "./lesson-step-navigator";

/** Stitch practice shell: step pills + level meta, no header card. */
export function PartShell({
	lessonId,
	part,
	onSelect,
	children,
}: {
	lessonId: string;
	part: ActivityType;
	onSelect: (part: ActivityType) => void;
	children: ReactNode;
}) {
	const detailQuery = useLessonDetail(lessonId);
	const detail = detailQuery.data;
	if (!detail) return null;

	return (
		<PageLayout>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<LessonStepNavigator
					lessonId={lessonId}
					activities={detail.activities}
					currentPart={part}
					onSelect={onSelect}
				/>
				<span className="chip px-3 py-1 text-xs">
					<CefrBadge value={detail.cefrLevel} />
				</span>
			</div>
			{children}
		</PageLayout>
	);
}
