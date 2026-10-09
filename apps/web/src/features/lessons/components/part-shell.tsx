import type { ActivityType } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { APP_ROUTES } from "#/app/app-route";
import { CefrBadge } from "#/components/common/cefr-badge";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageLayout } from "#/components/common/page-layout";
import { Button } from "#/components/ui/button";
import { useLessonDetail } from "#/features/lessons/queries";
import { m } from "#/paraglide/messages";
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
		<PageLayout
			hero={{
				icon: <MoMascot variant="heart" />,
				title: detail.title,
				description: detail.description,
			}}
			action={
				<Button asChild variant="ghost" size="sm" className="w-fit">
					<Link to={APP_ROUTES.LESSONS.DETAIL} params={{ slug: detail.slug }}>
						<ArrowLeft data-icon="inline-start" />
						{m["lessons.detail.backToLesson"]()}
					</Link>
				</Button>
			}
		>
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
