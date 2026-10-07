import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getLessonDetail, listSections } from "#/features/lessons/service";

export const lessonKeys = {
	sections: ["lesson-sections"] as const,
	detail: (id: string) => ["lesson", id] as const,
};

/** Sync title lookup for breadcrumbs (staticData labels can't await). */
export const lessonTitleCache = new Map<string, string>();

function cacheTitles(sections: { units: { id: string; title: string }[] }[]) {
	for (const section of sections) {
		for (const unit of section.units) {
			lessonTitleCache.set(unit.id, unit.title);
		}
	}
}

export function useLessonSections() {
	const query = useQuery({
		queryKey: lessonKeys.sections,
		queryFn: () => listSections(),
	});
	useEffect(() => {
		if (query.data) cacheTitles(query.data);
	}, [query.data]);
	return query;
}

export function useLessonDetail(id: string | undefined) {
	const query = useQuery({
		queryKey: lessonKeys.detail(id ?? "none"),
		queryFn: () => getLessonDetail(id as string),
		enabled: !!id,
	});
	const title = query.data?.title;
	useEffect(() => {
		if (id && title) lessonTitleCache.set(id, title);
	}, [id, title]);
	return query;
}
