import type {
	ListStories,
	Pagination,
	StoryDetail,
	StoryItem,
} from "@engflex/contracts";
import { API_ROUTES } from "#/app/api-routes";
import { api, apiPage } from "#/lib/api/api";

export function listStories(
	params?: Partial<ListStories>,
): Promise<{ items: StoryItem[]; pagination: Pagination }> {
	const query: Record<string, string> = {};
	if (params?.page) query.page = String(params.page);
	if (params?.pageSize) query.pageSize = String(params.pageSize);
	if (params?.search?.trim()) query.search = params.search.trim();
	if (params?.cefr) query.cefr = params.cefr;
	if (params?.topic && params.topic !== "all") query.topic = params.topic;

	return apiPage<StoryItem>(
		API_ROUTES.STORIES.LIST,
		{ method: "GET" },
		{ query },
	);
}

export function getStoryBySlug(slug: string): Promise<StoryDetail> {
	return api<StoryDetail>(API_ROUTES.STORIES.BY_SLUG(slug), {
		method: "GET",
	});
}

export function getStoryById(id: string): Promise<StoryDetail> {
	return api<StoryDetail>(API_ROUTES.STORIES.BY_ID(id), {
		method: "GET",
	});
}

export function listStoryTopics(): Promise<string[]> {
	return api<string[]>(API_ROUTES.STORIES.TOPICS, {
		method: "GET",
	});
}
