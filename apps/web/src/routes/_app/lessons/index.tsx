import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { useMemo, useState } from "react";
import { breadcrumb } from "#/app/breadcrumbs";
import { PageHeader } from "#/components/common/page-header";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { LessonCard } from "#/features/lessons/components/lesson-card";
import {
	DEFAULT_LESSON_FILTERS,
	LessonFilterBar,
	type LessonFilters,
} from "#/features/lessons/components/lesson-filter-bar";
import { LESSONS } from "#/features/lessons/fixtures";
import { lessonsStore, progressFrom } from "#/features/lessons/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/lessons/")({
	staticData: breadcrumb(() => m["nav.lessons"]()),
	component: LessonsPage,
});

function LessonsPage() {
	const [filters, setFilters] = useState<LessonFilters>(DEFAULT_LESSON_FILTERS);
	const storeState = useStore(lessonsStore);

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
				filters.status !== "all" &&
				progressFrom(storeState, lesson.id).status !== filters.status
			)
				return false;
			if (filters.skill !== "all" && lesson.details.skill !== filters.skill)
				return false;
			return true;
		});
	}, [filters, storeState]);

	return (
		<div className="container-content flex flex-col gap-6 py-8">
			<PageHeader
				title={m["lessons.hubTitle"]()}
				subtitle={m["lessons.hubSubtitle"]()}
			/>
			<LessonFilterBar filters={filters} onChange={setFilters} />
			{visible.length === 0 ? (
				<Empty className="rounded-xl border bg-card">
					<EmptyHeader>
						<EmptyTitle>{m["lessons.emptyTitle"]()}</EmptyTitle>
						<EmptyDescription>{m["lessons.emptyBody"]()}</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button
							variant="outline"
							onClick={() => setFilters(DEFAULT_LESSON_FILTERS)}
						>
							{m["common.resetFilters"]()}
						</Button>
					</EmptyContent>
				</Empty>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{visible.map((lesson) => (
						<LessonCard
							key={lesson.id}
							lesson={lesson}
							progress={progressFrom(storeState, lesson.id)}
						/>
					))}
				</div>
			)}
		</div>
	);
}
