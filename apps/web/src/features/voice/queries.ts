import type { StartConversation } from "@engflex/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createConversation,
	endConversation,
	getConversation,
} from "#/features/voice/service";

export const conversationKeys = {
	byId: (id: string) => ["conversation", id] as const,
};

export function useConversation(id: string) {
	return useQuery({
		queryKey: conversationKeys.byId(id),
		queryFn: () => getConversation(id),
		enabled: id.length > 0,
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
