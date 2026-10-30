import type {
	ExamType,
	PatchExamAttempt,
	StartExamAttempt,
} from "@engflex/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	getExamAttempt,
	listExamAttempts,
	listExamCategories,
	listExamTests,
	patchExamAttempt,
	startExamAttempt,
} from "#/features/exams/service";

export const examKeys = {
	all: ["exams"] as const,
	categories: (params?: { type?: ExamType }) =>
		[...examKeys.all, "categories", params?.type ?? "all"] as const,
	tests: (categoryId: string, params?: { page?: number; pageSize?: number }) =>
		[...examKeys.all, "categories", categoryId, "tests", params] as const,
	attempts: (params?: { page?: number; pageSize?: number }) =>
		[...examKeys.all, "attempts", params] as const,
	attempt: (id: string) => [...examKeys.all, "attempt", id] as const,
};

export function examCategoriesQueryOptions(params?: { type?: ExamType }) {
	return {
		queryKey: examKeys.categories(params),
		queryFn: () => listExamCategories(params),
	};
}

export function examTestsQueryOptions(
	categoryId: string,
	params?: { page?: number; pageSize?: number },
) {
	return {
		queryKey: examKeys.tests(categoryId, params),
		queryFn: () => listExamTests(categoryId, params),
	};
}

export function examAttemptsQueryOptions(params?: {
	page?: number;
	pageSize?: number;
}) {
	return {
		queryKey: examKeys.attempts(params),
		queryFn: () => listExamAttempts(params),
	};
}

export function examAttemptQueryOptions(id: string) {
	return {
		queryKey: examKeys.attempt(id),
		queryFn: () => getExamAttempt(id),
	};
}

export function useExamCategories(params?: { type?: ExamType }) {
	return useQuery(examCategoriesQueryOptions(params));
}

export function useExamTests(
	categoryId: string | undefined,
	params?: { page?: number; pageSize?: number },
) {
	return useQuery({
		...examTestsQueryOptions(categoryId ?? "none", params),
		enabled: !!categoryId,
	});
}

export function useExamAttempts(params?: { page?: number; pageSize?: number }) {
	return useQuery(examAttemptsQueryOptions(params));
}

export function useExamAttempt(id: string | undefined) {
	return useQuery({
		...examAttemptQueryOptions(id ?? "none"),
		enabled: !!id,
	});
}

export function useStartExamAttempt() {
	return useMutation({
		mutationFn: (input: { testId: string; req: StartExamAttempt }) =>
			startExamAttempt(input.testId, input.req),
	});
}

export function usePatchExamAttempt() {
	return useMutation({
		mutationFn: (input: { attemptId: string; req: PatchExamAttempt }) =>
			patchExamAttempt(input.attemptId, input.req),
	});
}
