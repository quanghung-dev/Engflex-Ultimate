import type { Lesson, LessonProgress } from "@engflex/contracts";
import { m } from "#/paraglide/messages";
import { LessonCard } from "./lesson-card";

export function UnitSection({
	n,
	title,
	description,
	lessons,
	progressById,
	lockedById,
	recommendedId,
}: {
	n: number;
	title: string;
	description: string;
	lessons: Lesson[];
	progressById: Record<string, LessonProgress>;
	lockedById: Record<string, boolean>;
	recommendedId?: string;
}) {
	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-start gap-3">
					<span
						className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-primary text-lg font-bold text-primary-foreground"
						style={{ boxShadow: "0 2px 0 #433095" }}
					>
						{n}
					</span>
					<div className="min-w-0">
						<h2 className="text-lg font-bold text-foreground">
							{m["lessons.unit.label"]({ n })}: {title}
						</h2>
						<p className="text-[15px] font-medium text-muted-foreground">
							{description}
						</p>
					</div>
				</div>
				<span className="shrink-0 text-xs font-bold text-muted-foreground">
					{m["lessons.unit.lessons"]({ count: lessons.length })}
				</span>
			</div>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{lessons.map((lesson) => (
					<LessonCard
						key={lesson.id}
						lesson={lesson}
						progress={
							progressById[lesson.id] ?? {
								status: "unstarted",
								percent: 0,
								partsCompleted: 0,
								partsTotal: lesson.partCount,
								bookmarked: false,
							}
						}
						locked={lockedById[lesson.id] ?? false}
						recommended={recommendedId === lesson.id}
					/>
				))}
			</div>
		</section>
	);
}
