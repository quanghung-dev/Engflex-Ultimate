import type { Conversation, StartConversation } from "@engflex/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	analyzeTurn,
	createConversation,
	createScenario,
	endConversation,
	getConversation,
	listPersonas,
	listScenarios,
} from "#/features/voice/service";

export const conversationKeys = {
	byId: (id: string) => ["conversation", id] as const,
};

export function useConversation(
	id: string,
	opts?: { refetchInterval?: number },
) {
	return useQuery({
		queryKey: conversationKeys.byId(id),
		queryFn: () => getConversation(id),
		enabled: id.length > 0,
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

export function useScenarios(params?: {
	topicId?: string;
	scope?: "all" | "custom";
}) {
	return useQuery({
		queryKey: [
			...scenarioKeys.all,
			params?.topicId ?? "all",
			params?.scope ?? "all",
		],
		queryFn: () => listScenarios(params),
	});
}

export function useCreateScenario() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createScenario,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: scenarioKeys.all }),
	});
}

export function usePersonas() {
	return useQuery({
		queryKey: ["personas"],
		queryFn: listPersonas,
	});
}
