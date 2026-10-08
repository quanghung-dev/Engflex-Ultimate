import type { Conversation, StartConversation } from "@engflex/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	analyzeTurn,
	createConversation,
	endConversation,
	getConversation,
	getScenarioById,
	listPersonas,
	listScenarios,
	listTopicsWithPreview,
} from "#/features/voice/service";

export const conversationKeys = {
	byId: (id: string) => ["conversation", id] as const,
};

export function useConversation(
	id: string,
	opts?: { refetchInterval?: number; enabled?: boolean },
) {
	return useQuery({
		queryKey: conversationKeys.byId(id),
		queryFn: () => getConversation(id),
		enabled: id.length > 0 && (opts?.enabled ?? true),
		refetchInterval: opts?.refetchInterval,
	});
}

export function useCreateConversation() {
	return useMutation({
		mutationFn: (input: StartConversation) => createConversation(input),
	});
}

export function useEndConversation(id: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => endConversation(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: conversationKeys.byId(id) }),
	});
}

export function useAnalyzeTurn(conversationId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (position: number) => analyzeTurn(conversationId, position),
		onSuccess: (feedback, position) =>
			queryClient.setQueryData<Conversation>(
				conversationKeys.byId(conversationId),
				(prev) =>
					prev
						? {
								...prev,
								turns: prev.turns.map((turn) =>
									turn.position === position ? { ...turn, feedback } : turn,
								),
							}
						: prev,
			),
	});
}

export const scenarioKeys = {
	all: ["scenarios"] as const,
	topic: (topicId: string) => ["scenarios", topicId] as const,
};

export function useScenarios(params?: { topicId?: string }) {
	return useQuery({
		queryKey: [...scenarioKeys.all, params?.topicId ?? "all"],
		queryFn: () => listScenarios(params),
	});
}

export function topicsWithPreviewQueryOptions(params?: {
	difficulty?: string;
	search?: string;
}) {
	const difficulty = params?.difficulty;
	const search = params?.search;
	return {
		queryKey: ["scenario-topics", difficulty ?? "all", search ?? ""] as const,
		queryFn: () => listTopicsWithPreview({ previewK: 3, difficulty, search }),
	};
}

export function useTopicsWithPreview(params?: {
	difficulty?: string;
	search?: string;
}) {
	return useQuery(topicsWithPreviewQueryOptions(params));
}

export function scenarioQueryOptions(id: string) {
	return {
		queryKey: ["scenario", id] as const,
		queryFn: () => getScenarioById(id),
	};
}

export function useScenario(id: string | undefined) {
	return useQuery({
		...scenarioQueryOptions(id ?? "none"),
		enabled: !!id,
	});
}

export function usePersonas() {
	return useQuery({
		queryKey: ["personas"],
		queryFn: listPersonas,
	});
}
