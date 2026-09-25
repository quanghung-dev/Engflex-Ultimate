import type { CreateCustomScenario, Scenario } from "@engflex/contracts";
import { Store } from "@tanstack/store";
import { getScenario } from "./fixtures";

export type SessionState = {
	/** User-authored scenarios live alongside the session so scripts can resolve them. */
	customScenarios: Scenario[];
};

export const voiceSessionStore = new Store<SessionState>({
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
