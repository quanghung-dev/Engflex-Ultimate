import type {
	ConversationMode,
	CreateCustomScenario,
	Scenario,
	Turn,
	TurnFeedback,
} from "@engflex/contracts";
import { Store } from "@tanstack/store";
import { getScenario } from "./fixtures";
import { buildSessionScript } from "./scripts";
import type { SessionScript, SessionStatus, StudioEvent } from "./types";

export type SessionState = {
	status: SessionStatus;
	mode: ConversationMode;
	scenarioId?: string;
	script: SessionScript;
	eventIndex: number;
	revealedChars: number;
	elapsedMs: number;
	micMuted: boolean;
	turns: Turn[];
	/** Per-turn feedback keyed by turn id (Turn carries no feedback field in the contract). */
	feedbackByTurn: Record<string, TurnFeedback>;
	analyzedTurnIds: string[];
	/** User-authored scenarios live alongside the session so scripts can resolve them. */
	customScenarios: Scenario[];
};

const IDLE_SCRIPT = buildSessionScript("free_talk");

export const voiceSessionStore = new Store<SessionState>({
	status: "idle",
	mode: "free_talk",
	scenarioId: undefined,
	script: IDLE_SCRIPT,
	eventIndex: 0,
	revealedChars: 0,
	elapsedMs: 0,
	micMuted: false,
	turns: [],
	feedbackByTurn: {},
	analyzedTurnIds: [],
	customScenarios: [],
});

/** Built-in fixtures first, then user-authored scenarios. */
export function resolveScenario(id: string): Scenario | undefined {
	return (
		getScenario(id) ??
		voiceSessionStore.state.customScenarios.find((item) => item.id === id)
	);
}

/** Adds a custom scenario with a deterministic unique id and returns it. */
export function addCustomScenario(input: CreateCustomScenario): Scenario {
	const slug = input.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
	const taken = new Set(
		voiceSessionStore.state.customScenarios.map((item) => item.id),
	);
	let id = `custom-${slug}`;
	let suffix = 2;
	while (taken.has(id)) {
		id = `custom-${slug}-${suffix}`;
		suffix += 1;
	}
	const scenario: Scenario = {
		id,
		topicId: "custom",
		title: input.title,
		objective: input.objective,
		cefrLevel: input.difficulty,
		durationMin: input.durationMin,
		durationMax: input.durationMax,
		isCustom: true,
	};
	voiceSessionStore.setState((state) => ({
		...state,
		customScenarios: [...state.customScenarios, scenario],
	}));
	return scenario;
}

export function startSession(
	mode: ConversationMode,
	scenarioId?: string,
): void {
	const scenario = scenarioId ? resolveScenario(scenarioId) : undefined;
	const script = buildSessionScript(mode, scenario);
	voiceSessionStore.setState((state) => ({
		status: "live",
		mode,
		scenarioId: scenario?.id,
		script,
		eventIndex: 0,
		revealedChars: 0,
		elapsedMs: 0,
		micMuted: false,
		turns: [],
		feedbackByTurn: {},
		analyzedTurnIds: [],
		customScenarios: state.customScenarios,
	}));
}

/** Room re-entry: a fresh default free-talk session unless one is in flight. */
export function ensureFreshSession(): void {
	if (voiceSessionStore.state.status !== "live") {
		startSession("free_talk");
	}
}

export function endSession(): void {
	voiceSessionStore.setState((state) => ({
		...state,
		status: "ended",
		micMuted: true,
	}));
}

export function toggleMic(): void {
	voiceSessionStore.setState((state) =>
		state.status === "ended" ? state : { ...state, micMuted: !state.micMuted },
	);
}

export function markAnalyzed(turnId: string): void {
	voiceSessionStore.setState((state) =>
		state.analyzedTurnIds.includes(turnId)
			? state
			: { ...state, analyzedTurnIds: [...state.analyzedTurnIds, turnId] },
	);
}

/**
 * Advance the scripted engine by `deltaMs`. Called from exactly one interval in
 * the studio screen. While muted the engine is paused (nothing advances).
 */
export function advanceSession(deltaMs: number): void {
	voiceSessionStore.setState((state) => {
		if (state.status !== "live" || state.micMuted) return state;
		const elapsedMs = state.elapsedMs + deltaMs;
		const event: StudioEvent | undefined =
			state.script.events[state.eventIndex];
		if (!event) return { ...state, elapsedMs }; // script finished; stay live until End

		const perTick = 2;
		const revealedChars = Math.min(
			event.text.length,
			state.revealedChars + perTick,
		);
		if (revealedChars < event.text.length) {
			return { ...state, elapsedMs, revealedChars };
		}

		const id = `turn-${state.eventIndex + 1}`;
		const turn: Turn = {
			id,
			position: state.eventIndex + 1,
			role: event.kind,
			text: event.text,
			createdAt: "2026-09-23T09:00:00Z",
		};
		return {
			...state,
			elapsedMs,
			eventIndex: state.eventIndex + 1,
			revealedChars: 0,
			turns: [...state.turns, turn],
			feedbackByTurn:
				event.kind === "user" && event.feedback
					? { ...state.feedbackByTurn, [id]: event.feedback }
					: state.feedbackByTurn,
		};
	});
}

/** Text typed so far for the streaming bubble (empty when nothing streams). */
export function currentStreamingText(state: SessionState): string {
	if (state.status !== "live") return "";
	const event = state.script.events[state.eventIndex];
	if (!event) return "";
	return event.text.slice(0, state.revealedChars);
}

/** Drives the pulse/badge: idle, listening (user turn or muted), ai-speaking. */
export function sessionPhase(
	state: SessionState,
): "idle" | "listening" | "ai-speaking" {
	if (state.status !== "live") return "idle";
	if (state.micMuted) return "listening";
	const event = state.script.events[state.eventIndex];
	if (!event) return "listening";
	if (state.revealedChars >= event.text.length) return "listening";
	return event.kind === "ai" ? "ai-speaking" : "listening";
}
