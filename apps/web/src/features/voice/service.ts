import type {
	Conversation,
	ConversationSession,
	StartConversation,
} from "@engflex/contracts";
import { API_ROUTES } from "#/app/api-routes";
import { api } from "#/lib/api";

export function createConversation(
	input: StartConversation,
): Promise<Conversation> {
	return api<Conversation>(
		API_ROUTES.CONVERSATIONS.CREATE,
		{
			method: "POST",
			body: JSON.stringify(input),
		},
		{ withCredentials: true },
	);
}

export function getConversation(id: string): Promise<Conversation> {
	return api<Conversation>(API_ROUTES.CONVERSATIONS.BY_ID(id), undefined, {
		withCredentials: true,
	});
}

export function endConversation(id: string): Promise<Conversation> {
	return api<Conversation>(
		API_ROUTES.CONVERSATIONS.END(id),
		{ method: "POST" },
		{ withCredentials: true },
	);
}

export type { Conversation, ConversationSession };
