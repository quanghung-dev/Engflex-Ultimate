import type { ListStories } from "@engflex/contracts";
import { useQuery } from "@tanstack/react-query";
import {
	getStoryById,
	getStoryBySlug,
	listStories,
	listStoryTopics,
} from "./service";

export const storyKeys = {
	all: ["stories"] as const,
	lists: () => [...storyKeys.all, "list"] as const,
	list: (params?: Partial<ListStories>) =>
		[...storyKeys.lists(), params] as const,
	details: () => [...storyKeys.all, "detail"] as const,
	detailBySlug: (slug: string) =>
		[...storyKeys.details(), "slug", slug] as const,
	detailById: (id: string) => [...storyKeys.details(), "id", id] as const,
	topics: () => [...storyKeys.all, "topics"] as const,
};

export function storiesListQueryOptions(params?: Partial<ListStories>) {
	return {
		queryKey: storyKeys.list(params),
		queryFn: () => listStories(params),
	};
}

export function storyDetailBySlugQueryOptions(slug: string) {
	return {
		queryKey: storyKeys.detailBySlug(slug),
		queryFn: () => getStoryBySlug(slug),
	};
}

export function storyDetailByIdQueryOptions(id: string) {
	return {
		queryKey: storyKeys.detailById(id),
		queryFn: () => getStoryById(id),
	};
}

export function storyTopicsQueryOptions() {
	return {
		queryKey: storyKeys.topics(),
		queryFn: () => listStoryTopics(),
	};
}

export function useStories(params?: Partial<ListStories>) {
	return useQuery(storiesListQueryOptions(params));
}

export function useStoryDetail(slug: string | undefined) {
	return useQuery({
		...storyDetailBySlugQueryOptions(slug ?? "none"),
		enabled: !!slug,
	});
}

export function useStoryTopics() {
	return useQuery(storyTopicsQueryOptions());
}
