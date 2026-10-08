import type {
	CEFR,
	Gender,
	Persona,
	Scenario,
	ScenarioDifficulty,
} from "@engflex/contracts";
import { useStore } from "@tanstack/react-store";
import {
	cefrColumn,
	cefrOptions,
	fromNone,
	textColumn,
	titleColumn,
	withNone,
} from "#/features/admin/components/columns";
import { NONE } from "#/features/admin/components/resource-form-dialog";
import {
	type ResourceConfig,
	ResourcePanel,
} from "#/features/admin/components/resource-panel";
import { ADMIN_SCENARIO_TOPICS } from "#/features/admin/fixtures";
import { formatDuration } from "#/features/admin/format";
import {
	adminStore,
	newAdminId,
	removeRow,
	saveRow,
} from "#/features/admin/store";
import { m } from "#/paraglide/messages";

const DIFFICULTIES: ScenarioDifficulty[] = ["B1+", "B2", "C1"];

const GENDER_LABELS: Record<Gender, () => string> = {
	female: () => m["admin.scenarios.personas.gender.female"](),
	male: () => m["admin.scenarios.personas.gender.male"](),
};

/* --------------------------------------------------------- scenarios */

type ScenarioForm = {
	title: string;
	topicId: string;
	personaId: string;
	cefrLevel: string;
	maxDuration: number;
	objective: string;
};

function scenarioConfig(
	personas: Persona[],
): ResourceConfig<Scenario, ScenarioForm> {
	return {
		noun: () => m["admin.scenarios.scenarios.noun"](),
		columns: [
			titleColumn(
				"title",
				() => m["admin.fields.title"](),
				(scenario) => scenario.title,
				(scenario) => scenario.objective,
			),
			textColumn(
				"topic",
				() => m["admin.fields.topic"](),
				(scenario) => scenario.topic?.name,
			),
			textColumn(
				"persona",
				() => m["admin.fields.persona"](),
				(scenario) => scenario.persona?.name,
			),
			cefrColumn((scenario) => scenario.cefrLevel),
			{
				id: "maxDuration",
				header: () => m["admin.fields.duration"](),
				accessorFn: (scenario) => scenario.maxDuration,
				enableGlobalFilter: false,
				cell: ({ row }) => (
					<span className="text-muted-foreground tabular-nums">
						{formatDuration(row.original.maxDuration)}
					</span>
				),
			},
		],
		fields: [
			{
				name: "title",
				label: () => m["admin.fields.title"](),
				kind: "text",
				required: true,
				full: true,
			},
			{
				name: "topicId",
				label: () => m["admin.fields.topic"](),
				kind: "select",
				options: () =>
					withNone(
						ADMIN_SCENARIO_TOPICS.map((topic) => ({
							value: topic.id,
							label: topic.name,
						})),
					),
			},
			{
				name: "personaId",
				label: () => m["admin.fields.persona"](),
				kind: "select",
				options: () =>
					withNone(
						personas.map((persona) => ({
							value: persona.id,
							label: persona.name,
						})),
					),
			},
			{
				name: "cefrLevel",
				label: () => m["admin.fields.cefr"](),
				kind: "select",
				options: () =>
					DIFFICULTIES.map((level) => ({ value: level, label: level })),
			},
			{
				name: "maxDuration",
				label: () => m["admin.fields.durationSeconds"](),
				kind: "number",
			},
			{
				name: "objective",
				label: () => m["admin.fields.objective"](),
				kind: "textarea",
				required: true,
			},
		],
		blank: () => ({
			title: "",
			topicId: NONE,
			personaId: NONE,
			cefrLevel: "B2",
			maxDuration: 300,
			objective: "",
		}),
		toForm: (scenario) => ({
			title: scenario.title,
			topicId: scenario.topic?.id ?? NONE,
			personaId: scenario.persona?.id ?? NONE,
			cefrLevel: scenario.cefrLevel,
			maxDuration: scenario.maxDuration,
			objective: scenario.objective,
		}),
		fromForm: (values, scenario) => {
			const topicId = fromNone(values.topicId);
			const personaId = fromNone(values.personaId);
			return {
				details: {},
				...scenario,
				id: scenario?.id ?? newAdminId("scenario"),
				title: values.title.trim(),
				topic: ADMIN_SCENARIO_TOPICS.find((topic) => topic.id === topicId),
				persona: personas.find((persona) => persona.id === personaId),
				cefrLevel: values.cefrLevel as ScenarioDifficulty,
				maxDuration: Math.round(values.maxDuration),
				objective: values.objective.trim(),
			};
		},
		label: (scenario) => scenario.title,
	};
}

export function ScenariosPanel() {
	const rows = useStore(adminStore, (state) => state.scenarios);
	const personas = useStore(adminStore, (state) => state.personas);
	return (
		<ResourcePanel
			config={scenarioConfig(personas)}
			rows={rows}
			onSave={(row) => saveRow("scenarios", row)}
			onDelete={(row) => removeRow("scenarios", row.id)}
		/>
	);
}

/* ---------------------------------------------------------- personas */

type PersonaForm = {
	name: string;
	roleTitle: string;
	gender: string;
	defaultCefr: string;
	personality: string;
	style: string;
	objective: string;
};

const PERSONA_CONFIG: ResourceConfig<Persona, PersonaForm> = {
	noun: () => m["admin.scenarios.personas.noun"](),
	columns: [
		titleColumn(
			"name",
			() => m["admin.fields.name"](),
			(persona) => persona.name,
			(persona) => persona.roleTitle,
		),
		textColumn(
			"gender",
			() => m["admin.fields.gender"](),
			(persona) => GENDER_LABELS[persona.gender](),
		),
		cefrColumn(
			(persona) => persona.defaultCefr,
			() => m["admin.fields.defaultCefr"](),
		),
		titleColumn(
			"style",
			() => m["admin.fields.style"](),
			(persona) => persona.style,
			(persona) => persona.personality,
		),
	],
	fields: [
		{
			name: "name",
			label: () => m["admin.fields.name"](),
			kind: "text",
			required: true,
		},
		{
			name: "roleTitle",
			label: () => m["admin.fields.roleTitle"](),
			kind: "text",
			required: true,
		},
		{
			name: "gender",
			label: () => m["admin.fields.gender"](),
			kind: "select",
			options: () =>
				(Object.keys(GENDER_LABELS) as Gender[]).map((value) => ({
					value,
					label: GENDER_LABELS[value](),
				})),
		},
		{
			name: "defaultCefr",
			label: () => m["admin.fields.defaultCefr"](),
			kind: "select",
			options: () => withNone(cefrOptions()),
		},
		{
			name: "personality",
			label: () => m["admin.fields.personality"](),
			kind: "text",
			full: true,
		},
		{
			name: "style",
			label: () => m["admin.fields.style"](),
			kind: "text",
			full: true,
		},
		{
			name: "objective",
			label: () => m["admin.fields.objective"](),
			kind: "textarea",
		},
	],
	blank: () => ({
		name: "",
		roleTitle: "",
		gender: "female",
		defaultCefr: NONE,
		personality: "",
		style: "",
		objective: "",
	}),
	toForm: (persona) => ({
		name: persona.name,
		roleTitle: persona.roleTitle,
		gender: persona.gender,
		defaultCefr: persona.defaultCefr ?? NONE,
		personality: persona.personality,
		style: persona.style,
		objective: persona.objective,
	}),
	fromForm: (values, persona) => ({
		...persona,
		id: persona?.id ?? newAdminId("persona"),
		name: values.name.trim(),
		roleTitle: values.roleTitle.trim(),
		gender: values.gender as Gender,
		defaultCefr: fromNone(values.defaultCefr) as CEFR | undefined,
		personality: values.personality.trim(),
		style: values.style.trim(),
		objective: values.objective.trim(),
	}),
	label: (persona) => persona.name,
};

export function PersonasPanel() {
	const rows = useStore(adminStore, (state) => state.personas);
	return (
		<ResourcePanel
			config={PERSONA_CONFIG}
			rows={rows}
			onSave={(row) => saveRow("personas", row)}
			onDelete={(row) => removeRow("personas", row.id)}
		/>
	);
}
