import type {
	AttemptType,
	CompleteVideoAttempt,
	ListVideoExercises,
	SaveVideoProgress,
} from "@engflex/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	completeVideoAttempt,
	getOpenVideoAttempt,
	getVideo,
	listCategoryPreviews,
	listVideos,
	saveVideoProgress,
	startVideoAttempt,
} from "#/features/videos/service";
import { ApiError } from "#/lib/api/api";

export const videoKeys = {
	all: ["videos"] as const,
	preview: (previewK: number) =>
		[...videoKeys.all, "preview", previewK] as const,
	list: (params: Partial<ListVideoExercises>) =>
		[...videoKeys.all, "list", params] as const,
	detail: (id: string) => [...videoKeys.all, "detail", id] as const,
	openAttempt: (id: string, type: AttemptType) =>
		[...videoKeys.all, "attempt", "open", id, type] as const,
};

export function videoPreviewQueryOptions(previewK: number) {
	return {
		queryKey: videoKeys.preview(previewK),
		queryFn: () => listCategoryPreviews(previewK),
	};
}

export function videoListQueryOptions(params: Partial<ListVideoExercises>) {
	return {
		queryKey: videoKeys.list(params),
		queryFn: () => listVideos(params),
	};
}

export function videoDetailQueryOptions(id: string) {
	return {
		queryKey: videoKeys.detail(id),
		queryFn: () => getVideo(id),
	};
}

export function openVideoAttemptQueryOptions(id: string, type: AttemptType) {
	return {
		queryKey: videoKeys.openAttempt(id, type),
		queryFn: () => getOpenVideoAttempt(id, type),
		retry: (failureCount: number, error: unknown) =>
			!(error instanceof ApiError && error.status === 404) && failureCount < 3,
	};
}

export function useStartVideoAttempt() {
	return useMutation({
		mutationFn: (input: { videoId: string; type: AttemptType }) =>
		startVideoAttempt(input.videoId, input.type),
	});
}

export function useSaveVideoProgress() {
	return useMutation({
		mutationFn: (input: {
			videoId: string;
			attemptId: string;
			req: SaveVideoProgress;
		}) => saveVideoProgress(input.videoId, input.attemptId, input.req),
	});
}

export function useCompleteVideoAttempt() {
	return useMutation({
		mutationFn: (input: {
			videoId: string;
			attemptId: string;
			req: CompleteVideoAttempt;
		}) => completeVideoAttempt(input.videoId, input.attemptId, input.req),
	});	
}

export function useVideoPreview(previewK: number) {
	return useQuery(videoPreviewQueryOptions(previewK));
}

export function useVideoList(params: Partial<ListVideoExercises>) {
	return useQuery(videoListQueryOptions(params));
}

export function useVideo(id: string) {
	return useQuery(videoDetailQueryOptions(id));
}
