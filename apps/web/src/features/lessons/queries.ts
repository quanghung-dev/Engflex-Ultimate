import { useMutation, useQuery } from "@tanstack/react-query";
import {
	checkAnswer,
	getLessonDetail,
	getLessonDetailBySlug,
	listSections,
	pronounceAttempt,
} from "#/features/lessons/service";

export const lessonKeys = {
	sections: ["lesson-sections"] as const,
	detail: (id: string) => ["lesson", id] as const,
	detailBySlug: (slug: string) => ["lesson", "slug", slug] as const,
};

export function useLessonSections() {
	return useQuery({
		queryKey: lessonKeys.sections,
		queryFn: () => listSections(),
	});
}

/** Shared config so hub-level aggregates can `useQueries` the same objects
 *  the cards fetch (React Query dedupes identical keys). */
export function lessonDetailQueryOptions(id: string) {
	return {
		queryKey: lessonKeys.detail(id),
		queryFn: () => getLessonDetail(id),
	};
}

export function useLessonDetail(id: string | undefined) {
	return useQuery({
		...lessonDetailQueryOptions(id ?? "none"),
		enabled: !!id,
	});
}

export function useLessonDetailBySlug(slug: string | undefined) {
	return useQuery({
		queryKey: lessonKeys.detailBySlug(slug ?? "none"),
		queryFn: () => getLessonDetailBySlug(slug ?? "none"),
		enabled: !!slug,
	});
}

export function useCheckAnswer() {
	return useMutation({
		mutationFn: (input: {
			activityId: string;
			questionIndex: number;
			key: string;
		}) => checkAnswer(input.activityId, input.questionIndex, input.key),
	});
}

export function usePronounceAttempt() {
	return useMutation({
		mutationFn: (input: {
			activityId: string;
			itemIndex: number;
			audio: Blob;
			mime: string;
		}) =>
			pronounceAttempt(
				input.activityId,
				input.itemIndex,
				input.audio,
				input.mime,
			),
	});
}
