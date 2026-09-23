import type { Persona, Scenario, ScenarioTopic } from "@engflex/contracts";
import {
	AudioWaveform,
	Clock3,
	Gauge,
	type LucideIcon,
	Users,
} from "lucide-react";
import architectureReviews from "#/assets/topics/architecture-reviews.png";
import crossFunctionalSync from "#/assets/topics/cross-functional-sync.png";
import jobInterviews from "#/assets/topics/job-interviews.png";
import productPitch from "#/assets/topics/product-pitch.png";

/** mock-only: no contract type yet — voice mode selector cards. */
export interface ModeCard {
	id: "spontaneous" | "structured";
	icon: LucideIcon;
	metaIcon: LucideIcon;
}

/** Verbatim from the voice mode-selector mock. */
export const MODE_CARDS: ModeCard[] = [
	{
		id: "spontaneous",
		icon: AudioWaveform,
		metaIcon: Clock3,
	},
	{
		id: "structured",
		icon: Users,
		metaIcon: Gauge,
	},
];

export const TOPIC_IMAGES: Record<string, string> = {
	"job-interviews": jobInterviews,
	"architecture-reviews": architectureReviews,
	"cross-functional-sync": crossFunctionalSync,
	"product-pitch": productPitch,
};

const personas: Record<string, Persona> = {
	"scenario-01": {
		id: "persona-01",
		name: "Amelia",
		roleTitle: "Hiring director",
		personality: "Warm but exacting",
		style: "Structured behavioural interviews",
		objective: "Assess leadership stories for measurable outcomes",
		defaultCefr: "B2",
	},
	"scenario-02": {
		id: "persona-02",
		name: "Marcus",
		roleTitle: "Senior interviewer",
		personality: "Direct, evidence-driven",
		style: "Post-mortem questioning",
		objective: "Test how you handle past failure and learning",
		defaultCefr: "B2",
	},
	"scenario-03": {
		id: "persona-03",
		name: "Priya",
		roleTitle: "VP of Talent",
		personality: "Polished negotiator",
		style: "Executive compensation talks",
		objective: "Reach a defensible compensation agreement",
		defaultCefr: "C1",
	},
	"scenario-04": {
		id: "persona-04",
		name: "Sarah",
		roleTitle: "Staff engineer",
		personality: "Analytical, sceptical",
		style: "Architecture design review",
		objective: "Stress-test the caching and failover decisions",
		defaultCefr: "C1",
	},
	"scenario-05": {
		id: "persona-05",
		name: "Tom",
		roleTitle: "Product manager",
		personality: "Pragmatic, deadline-driven",
		style: "Roadmap negotiation",
		objective: "Rebalance scope against the committed timeline",
		defaultCefr: "B2",
	},
	"scenario-06": {
		id: "persona-06",
		name: "Diego",
		roleTitle: "Head of Infrastructure",
		personality: "Calm under pressure",
		style: "Incident post-mortem",
		objective: "Establish preventive measures without blame",
		defaultCefr: "C1",
	},
	"scenario-07": {
		id: "persona-07",
		name: "Rachel",
		roleTitle: "Enterprise client VP",
		personality: "Frustrated but fair",
		style: "Escalation management",
		objective: "Restore trust with a credible remediation plan",
		defaultCefr: "B1",
	},
	"scenario-08": {
		id: "persona-08",
		name: "Omar",
		roleTitle: "Procurement lead",
		personality: "Numbers-first",
		style: "Commercial renegotiation",
		objective: "Protect margin while adjusting scope",
		defaultCefr: "C1",
	},
	"scenario-09": {
		id: "persona-09",
		name: "Yuki",
		roleTitle: "Design VP",
		personality: "Visionary, user-obsessed",
		style: "Design-engineering alignment",
		objective: "Find a pragmatic compromise on the roadmap",
		defaultCefr: "B2",
	},
	"scenario-10": {
		id: "persona-10",
		name: "Elena",
		roleTitle: "Managing Director",
		personality: "Strategic, time-poor",
		style: "Executive demo review",
		objective: "Judge narrative clarity and value framing",
		defaultCefr: "C1",
	},
	"scenario-11": {
		id: "persona-11",
		name: "Nathan",
		roleTitle: "Angel Investor",
		personality: "Sceptical, detail-hungry",
		style: "Investor Q&A",
		objective: "Interrogate unit economics and defensibility",
		defaultCefr: "B2",
	},
	"scenario-12": {
		id: "persona-12",
		name: "Charles",
		roleTitle: "Board Member",
		personality: "Formal, governance-minded",
		style: "Board strategy review",
		objective: "Justify headcount and infrastructure spend",
		defaultCefr: "C1",
	},
};

interface ScenarioSeed {
	id: string;
	difficulty: Scenario["cefrLevel"];
	durationMin: number;
	durationMax: number;
	title: string;
	objective: string;
}

const SCENARIO_SEEDS: Record<string, ScenarioSeed[]> = {
	"topic-1": [
		{
			id: "scenario-01",
			difficulty: "B2",
			durationMin: 8,
			durationMax: 10,
			title: "Behavioral questions on leadership",
			objective:
				"Articulate cross-functional conflict resolution using structured STAR methodology and leadership poise.",
		},
		{
			id: "scenario-02",
			difficulty: "B2",
			durationMin: 6,
			durationMax: 8,
			title: "Explaining project failure & learnings",
			objective:
				"Address past technical mistakes objectively while emphasizing post-mortem remediation and growth mindset.",
		},
		{
			id: "scenario-03",
			difficulty: "C1",
			durationMin: 10,
			durationMax: 12,
			title: "Salary negotiation with hiring director",
			objective:
				"Advocate for market-rate equity and base compensation with diplomatic firmness and polished leverage framing.",
		},
	],
	"topic-2": [
		{
			id: "scenario-04",
			difficulty: "C1",
			durationMin: 8,
			durationMax: 10,
			title: "Architectural RFC & database tradeoff defense",
			objective:
				"Defend distributed database partitioning schemes against concurrency challenges and latency trade-offs.",
		},
		{
			id: "scenario-05",
			difficulty: "B2",
			durationMin: 6,
			durationMax: 8,
			title: "Sprint retrospective & timeline pushback",
			objective:
				"Negotiate realistic engineering delivery milestones while articulating tech debt risks constructively.",
		},
		{
			id: "scenario-06",
			difficulty: "C1",
			durationMin: 7,
			durationMax: 9,
			title: "API outage post-mortem with leads",
			objective:
				"Walk through root-cause analysis transparently and articulate systematic preventive measures without panic.",
		},
	],
	"topic-3": [
		{
			id: "scenario-07",
			difficulty: "B1+",
			durationMin: 5,
			durationMax: 7,
			title: "De-escalating enterprise client incident",
			objective:
				"Calm frustrated enterprise accounts with clear empathy, transparent SLA compensation, and action timelines.",
		},
		{
			id: "scenario-08",
			difficulty: "C1",
			durationMin: 7,
			durationMax: 9,
			title: "Budget scope renegotiation",
			objective:
				"Protect project margin while offering creative tiered deliverable options under constrained budget realities.",
		},
		{
			id: "scenario-09",
			difficulty: "B2",
			durationMin: 8,
			durationMax: 10,
			title: "Aligning design roadmap with VP",
			objective:
				"Synthesize engineering constraints with design vision, proposing pragmatic compromises without sacrificing user delight.",
		},
	],
	"topic-4": [
		{
			id: "scenario-10",
			difficulty: "C1",
			durationMin: 10,
			durationMax: 12,
			title: "Product launch & vision demo",
			objective:
				"Pitch strategic AI initiatives to executive leadership with high narrative engagement and clear value propositions.",
		},
		{
			id: "scenario-11",
			difficulty: "B2",
			durationMin: 8,
			durationMax: 10,
			title: "Handling tough investor Q&A",
			objective:
				"Address unit economics, market churn risks, and competitive defensibility while staying composed under pressure.",
		},
		{
			id: "scenario-12",
			difficulty: "C1",
			durationMin: 12,
			durationMax: 15,
			title: "Annual strategy & budget defense",
			objective:
				"Articulate headcount growth and infrastructure spend return on investment with authoritative clarity.",
		},
	],
};

const TOPIC_META: Array<{
	id: string;
	slug: string;
	name: string;
	position: number;
}> = [
	{
		id: "topic-1",
		slug: "job-interviews",
		name: "Topic 1: Job interview simulations",
		position: 1,
	},
	{
		id: "topic-2",
		slug: "architecture-reviews",
		name: "Topic 2: Architecture & system design reviews",
		position: 2,
	},
	{
		id: "topic-3",
		slug: "cross-functional-sync",
		name: "Topic 3: Cross-functional sync & stakeholder collaboration",
		position: 3,
	},
	{
		id: "topic-4",
		slug: "product-pitch",
		name: "Topic 4: Product pitch & executive presentation",
		position: 4,
	},
];

/** 4 topics × 3 scenarios, transcribed from the persona-picker mock. */
export const SCENARIO_TOPICS: ScenarioTopic[] = TOPIC_META.map((topic) => ({
	...topic,
	scenarios: SCENARIO_SEEDS[topic.id].map((seed) => ({
		id: seed.id,
		topicId: topic.id,
		title: seed.title,
		objective: seed.objective,
		cefrLevel: seed.difficulty,
		durationMin: seed.durationMin,
		durationMax: seed.durationMax,
		persona: personas[seed.id],
		isCustom: false,
	})),
}));

export const SCENARIOS: Scenario[] = SCENARIO_TOPICS.flatMap(
	(topic) => topic.scenarios,
);

export function getScenario(id: string): Scenario | undefined {
	return SCENARIOS.find((scenario) => scenario.id === id);
}

export function getScenarioPersonaName(id: string): string {
	return getScenario(id)?.persona?.name ?? "Partner";
}
