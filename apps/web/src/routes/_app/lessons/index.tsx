import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { useMemo, useState } from "react";
import { breadcrumb } from "#/app/breadcrumbs";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageLayout } from "#/components/common/page-layout";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { HubHeroCard } from "#/features/lessons/components/hub-hero-card";
import {
	DEFAULT_LESSON_FILTERS,
	LessonFilterBar,
	type LessonFilters,
} from "#/features/lessons/components/lesson-filter-bar";
import { UnitSection } from "#/features/lessons/components/unit-section";
import { LESSON_META, LESSONS, UNITS } from "#/features/lessons/fixtures";
import { lessonsStore, progressFrom } from "#/features/lessons/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/lessons/")({
	staticData: breadcrumb(() => m["nav.item.lessons"]()),
	component: LessonsPage,
});

function LessonsPage() {
	const [filters, setFilters] = useState<LessonFilters>(DEFAULT_LESSON_FILTERS);
	const storeState = useStore(lessonsStore);

	const progressById = useMemo(() => {
		return Object.fromEntries(
			LESSONS.map((lesson) => [lesson.id, progressFrom(storeState, lesson.id)]),
		);
	}, [storeState]);

	const visible = useMemo(() => {
		const search = filters.search.trim().toLowerCase();
		return LESSONS.filter((lesson) => {
			if (search) {
				const haystack = `${lesson.title} ${lesson.description}`.toLowerCase();
				if (!haystack.includes(search)) return false;
			}
			if (filters.level !== "all" && lesson.cefrLevel !== filters.level)
				return false;
			if (
				filters.track !== "all" &&
				LESSON_META[lesson.id]?.track !== filters.track
			)
				return false;
			return true;
		});
	}, [filters]);

	const hero = useMemo(() => {
		for (const unit of UNITS) {
			const unitLessons = LESSONS.filter(
				(lesson) => LESSON_META[lesson.id]?.unit === unit.n,
			);
			const resume = unitLessons.find(
				(lesson) => progressById[lesson.id]?.status === "in_progress",
			);
			if (resume) {
				const recommended = unitLessons.find(
					(lesson) => progressById[lesson.id]?.status === "unstarted",
				);
				return {
					unit,
					lessons: unitLessons,
					resume,
					recommendedId: recommended?.id,
				};
			}
		}
		const first = UNITS[0];
		const unitLessons = LESSONS.filter(
			(lesson) => LESSON_META[lesson.id]?.unit === first?.n,
		);
		return {
			unit: first,
			lessons: unitLessons,
			resume: unitLessons[0],
			recommendedId: unitLessons[0]?.id,
		};
	}, [progressById]);

	const lockedById = useMemo(() => {
		const locked: Record<string, boolean> = {};
		for (const unit of UNITS) {
			const unitLessons = LESSONS.filter(
				(lesson) => LESSON_META[lesson.id]?.unit === unit.n,
			);
			let blocked = false;
			for (const lesson of unitLessons) {
				const status = progressById[lesson.id]?.status;
				if (status === "unstarted" && blocked) locked[lesson.id] = true;
				if (status === "unstarted") blocked = true;
			}
		}
		return locked;
	}, [progressById]);

	const sections = UNITS.map((unit) => ({
		unit,
		lessons: visible.filter(
			(lesson) => LESSON_META[lesson.id]?.unit === unit.n,
		),
	})).filter((section) => section.lessons.length > 0);

	return (
		<PageLayout
			hero={{
				icon: <MoMascot variant="open" size={84} />,
				title: m["lessons.hub.title"](),
				description: m["lessons.hub.moBody"](),
			}}
		>
			<LessonFilterBar filters={filters} onChange={setFilters} />
			{hero.unit && hero.resume ? (
				<HubHeroCard
					unit={hero.unit.n}
					unitTitle={hero.unit.title}
					lessons={hero.lessons}
					progressById={progressById}
					resumeId={hero.resume.id}
					resumeSlot={LESSON_META[hero.resume.id]?.slot ?? ""}
				/>
			) : null}
			{sections.length === 0 ? (
				<Empty className="surface-card items-center text-center">
					<MoMascot variant="confused" size={72} />
					<EmptyHeader>
						<EmptyTitle>{m["lessons.hub.emptyTitle"]()}</EmptyTitle>
						<EmptyDescription>{m["lessons.hub.emptyBody"]()}</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button
							variant="outline"
							className="btn btn-outline"
							onClick={() => setFilters(DEFAULT_LESSON_FILTERS)}
						>
							{m["common.actions.resetFilters"]()}
						</Button>
					</EmptyContent>
				</Empty>
			) : (
				sections.map((section) => (
					<UnitSection
						key={section.unit.n}
						n={section.unit.n}
						title={section.unit.title}
						description={section.unit.description}
						lessons={section.lessons}
						progressById={progressById}
						lockedById={lockedById}
						recommendedId={
							section.unit.n === hero.unit?.n ? hero.recommendedId : undefined
						}
					/>
				))
			)}
		</PageLayout>
	);
}
