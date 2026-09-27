import type {
	Conversation,
	ConversationSession,
	CreateCustomScenario,
	Pagination,
	Persona,
	Scenario,
	StartConversation,
	TranscriptResult,
	TurnFeedback,
} from "@engflex/contracts";
import { API_ROUTES } from "#/app/api-routes";
import { api, apiPage } from "#/lib/api";

/** The four actions of the correction window, in the engine's vocabulary. */
export type TranscriptAction = "review" | "retake" | "send" | "dismiss";

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

export function analyzeTurn(
	conversationId: string,
	position: number,
): Promise<TurnFeedback> {
	return api<TurnFeedback>(
		API_ROUTES.CONVERSATIONS.ANALYZE_TURN(conversationId, position),
		{ method: "POST" },
		{ withCredentials: true },
	);
}

/**
 * The correction modal's one command. The engine owns the window state and
 * resolves which turn is corrected, so nothing here names a turn.
 */
export function transcriptCommand(
	conversationId: string,
	action: TranscriptAction,
	text?: string,
): Promise<TranscriptResult> {
	return api<TranscriptResult>(
		API_ROUTES.CONVERSATIONS.TRANSCRIPT(conversationId),
		{ method: "POST", body: JSON.stringify({ action, text: text ?? "" }) },
		{ withCredentials: true },
	);
}

export function listScenarios(params?: {
	topicId?: string;
	scope?: "all" | "custom";
}): Promise<{ items: Scenario[]; pagination: Pagination }> {
	const query: Record<string, string> = {};
	if (params?.topicId) query.topicId = params.topicId;
	if (params?.scope) query.scope = params.scope;
	return apiPage<Scenario>(
		API_ROUTES.SCENARIOS.LIST,
		{ method: "GET" },
		{ withCredentials: true, query },
	);
}

export function createScenario(input: CreateCustomScenario): Promise<Scenario> {
	return api<Scenario>(
		API_ROUTES.SCENARIOS.CREATE,
		{ method: "POST", body: JSON.stringify(input) },
		{ withCredentials: true },
	);
}

export function listPersonas(): Promise<{
	items: Persona[];
	pagination: Pagination;
}> {
	return apiPage<Persona>(
		API_ROUTES.PERSONAS.LIST,
		{ method: "GET" },
		{ withCredentials: true },
	);
}
