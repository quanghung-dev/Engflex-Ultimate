import type {
	Activity,
	ActivityType,
	Category,
	DictationPayload,
	Lesson,
	ReadingPayload,
	VoicePayload,
	WritingPayload,
} from "@engflex/contracts";
import architectureReviews from "#/assets/topics/architecture-reviews.png";
import crossFunctionalSync from "#/assets/topics/cross-functional-sync.png";
import jobInterviews from "#/assets/topics/job-interviews.png";
import productPitch from "#/assets/topics/product-pitch.png";
import type { LessonDetailFixture } from "./types";

/** Every asset here is local — no external image URLs ship. */
export const TOPIC_COVERS = [
	jobInterviews,
	architectureReviews,
	crossFunctionalSync,
	productPitch,
] as const;

export const CATEGORIES: Category[] = [
	{
		id: "cat-1",
		slug: "workplace-communication",
		name: "Workplace communication",
	},
	{
		id: "cat-2",
		slug: "engineering-leadership",
		name: "Engineering leadership",
	},
	{ id: "cat-3", slug: "executive-presence", name: "Executive presence" },
	{
		id: "cat-4",
		slug: "cross-team-coordination",
		name: "Cross-team coordination",
	},
	{ id: "cat-5", slug: "boardroom-governance", name: "Boardroom governance" },
	{ id: "cat-6", slug: "people-culture", name: "People & culture" },
	{ id: "cat-7", slug: "product-management", name: "Product management" },
	{ id: "cat-8", slug: "financial-literacy", name: "Financial literacy" },
];

const categoryBySlug = (slug: string): Category | undefined =>
	CATEGORIES.find((category) => category.slug === slug);

interface LessonSeed {
	id: string;
	title: string;
	categorySlug: string;
	cefrLevel: Lesson["cefrLevel"];
	estimatedDurationMin: number;
	partCount: number;
	skill: ActivityType;
	description: string;
}

/** Titles/levels/durations/parts transcribed from the lesson-hub mock. */
const LESSON_SEEDS: LessonSeed[] = [
	{
		id: "describing-your-job",
		title: "Describing your job",
		categorySlug: "workplace-communication",
		cefrLevel: "B1",
		estimatedDurationMin: 25,
		partCount: 4,
		skill: "reading",
		description:
			"Learn how to introduce your professional role, articulate day-to-day responsibilities, and discuss active projects with confidence and clarity in international work environments.",
	},
	{
		id: "leading-sprint-reviews",
		title: "Leading sprint reviews",
		categorySlug: "engineering-leadership",
		cefrLevel: "C1",
		estimatedDurationMin: 20,
		partCount: 3,
		skill: "voice",
		description:
			"Run a confident sprint review: frame delivery status, defend trade-offs, and keep stakeholders aligned on the next increment.",
	},
	{
		id: "disagreeing-politely-in-meetings",
		title: "Disagreeing politely in meetings",
		categorySlug: "executive-presence",
		cefrLevel: "B2",
		estimatedDurationMin: 15,
		partCount: 2,
		skill: "writing",
		description:
			"Push back on proposals without friction, using diplomatic framing that keeps the room collaborative.",
	},
	{
		id: "writing-blocker-memos",
		title: "Writing blocker memos",
		categorySlug: "cross-team-coordination",
		cefrLevel: "B2",
		estimatedDurationMin: 18,
		partCount: 3,
		skill: "writing",
		description:
			"Escalate blockers in writing: state impact, name the dependency, and propose the decision you need.",
	},
	{
		id: "navigating-fast-paced-dialogues",
		title: "Navigating fast-paced dialogues",
		categorySlug: "boardroom-governance",
		cefrLevel: "C1",
		estimatedDurationMin: 12,
		partCount: 2,
		skill: "dictation",
		description:
			"Keep up with rapid executive exchanges and respond with precision instead of filler.",
	},
	{
		id: "de-escalating-team-tensions",
		title: "De-escalating team tensions",
		categorySlug: "people-culture",
		cefrLevel: "B1",
		estimatedDurationMin: 20,
		partCount: 4,
		skill: "voice",
		description:
			"Turn heated moments into productive ones by acknowledging concerns and refocusing on shared goals.",
	},
	{
		id: "defining-acceptance-criteria",
		title: "Defining acceptance criteria",
		categorySlug: "product-management",
		cefrLevel: "B2",
		estimatedDurationMin: 15,
		partCount: 3,
		skill: "reading",
		description:
			"Translate vague product asks into testable acceptance criteria both engineering and design can commit to.",
	},
	{
		id: "analyzing-earnings-reports",
		title: "Analyzing earnings reports",
		categorySlug: "financial-literacy",
		cefrLevel: "C1",
		estimatedDurationMin: 22,
		partCount: 3,
		skill: "reading",
		description:
			"Read quarterly numbers like an operator: spot the drivers, question the guidance, and summarise the takeaway.",
	},
	{
		id: "negotiating-project-timelines",
		title: "Negotiating project timelines & deliverables",
		categorySlug: "workplace-communication",
		cefrLevel: "B2",
		estimatedDurationMin: 30,
		partCount: 4,
		skill: "voice",
		description:
			"Practice executive pushbacks and boundary conditions with realistic stakeholder personas.",
	},
];

export const LESSONS: Lesson[] = LESSON_SEEDS.map((seed, index) => ({
	id: seed.id,
	slug: seed.id,
	title: seed.title,
	category: categoryBySlug(seed.categorySlug),
	cefrLevel: seed.cefrLevel,
	description: seed.description,
	details: {
		estimatedDurationMin: seed.estimatedDurationMin,
		acousticTargetPct: 85,
		coverImageUrl: TOPIC_COVERS[index % TOPIC_COVERS.length] ?? "",
		skill: seed.skill,
	},
	partCount: seed.partCount,
}));

const BLUEPRINTS = [
	{
		type: "reading",
		title: "Reading & comprehension",
		durationMin: 5,
		skillFocus: "Contextual vocabulary",
		description:
			"Read a short real-world workplace passage from a software engineer describing his daily duties and team role, then answer 4 comprehension questions.",
	},
	{
		type: "dictation",
		title: "Acoustic dictation",
		durationMin: 6,
		skillFocus: "Phoneme recognition",
		description:
			"Listen to natural conversational dialogue between colleagues and transcribe high-frequency target sentences with instant precision check.",
	},
	{
		type: "writing",
		title: "Guided writing",
		durationMin: 7,
		skillFocus: "Syntactic structure",
		description:
			"Draft a 60–100 word overview of your actual job, responsibilities, and active projects, receiving instant targeted grammar and naturalness checks.",
	},
	{
		type: "voice",
		title: "Free voice dialogue",
		durationMin: 7,
		skillFocus: "Acoustic feedback",
		description:
			"Engage in an interactive voice conversation with an AI partner practicing your self-introduction in a first-meeting scenario.",
	},
] as const satisfies readonly {
	type: ActivityType;
	title: string;
	durationMin: number;
	skillFocus: string;
	description: string;
}[];

export const READING_PAYLOAD: ReadingPayload = {
	passage: `Hi, I'm Daniel. I'm a software engineer at a technology company based in Berlin. Every morning at 9:30 AM, our team gathers for a fifteen-minute daily standup meeting. During this brief check-in, each developer shares what they worked on yesterday, what they plan to accomplish today, and any technical blockers standing in their way.

My primary responsibility is maintaining our payment infrastructure and ensuring transaction APIs respond reliably during peak hours. When unexpected incidents occur or dependency issues arise, I collaborate closely with product managers and quality assurance teams to resolve them before our scheduled deployment window.

Clear communication is just as crucial as writing clean code. When we negotiate project timelines, we focus on explaining technical tradeoffs in plain business terms so everyone understands the realistic scope of our commitments.`,
	questions: [
		{
			stem: "What is Daniel's primary responsibility in his engineering team?",
			instruction: "Select the best answer according to the passage.",
			options: [
				{ key: "A", text: "Organizing company-wide marketing campaigns" },
				{
					key: "B",
					text: "Maintaining payment infrastructure and API reliability",
				},
				{ key: "C", text: "Designing user interfaces for mobile applications" },
				{
					key: "D",
					text: "Managing human resources and recruiting junior interns",
				},
			],
		},
		{
			stem: "When does the team hold its daily standup meeting?",
			instruction: "Select the best answer according to the passage.",
			options: [
				{ key: "A", text: "Every morning at 9:30 AM" },
				{ key: "B", text: "Every afternoon at 4:00 PM" },
				{ key: "C", text: "Only on scheduled deployment days" },
				{ key: "D", text: "Once a week on Fridays" },
			],
		},
		{
			stem: "What does Daniel do when incidents or dependency issues arise?",
			instruction: "Select the best answer according to the passage.",
			options: [
				{ key: "A", text: "He escalates them to senior management" },
				{
					key: "B",
					text: "He collaborates with product managers and QA teams to resolve them",
				},
				{ key: "C", text: "He defers them to the next quarterly review" },
				{ key: "D", text: "He documents them without taking action" },
			],
		},
		{
			stem: "Why does Daniel emphasise clear communication?",
			instruction: "Select the best answer according to the passage.",
			options: [
				{
					key: "A",
					text: "Because it is just as crucial as writing clean code",
				},
				{ key: "B", text: "Because it shortens standup meetings" },
				{ key: "C", text: "Because it removes the need for documentation" },
				{ key: "D", text: "Because his manager requires daily updates" },
			],
		},
	],
};

export const DICTATION_PAYLOAD: DictationPayload = {
	sentences: [
		{
			prompt: "What do you do?",
			reference:
				"I'm responsible for backend development and building scalable APIs.",
			audioUrl: "",
			durationMs: 3800,
		},
		{
			prompt: "How does your team start the day?",
			reference:
				"Every morning we gather for a fifteen-minute daily standup meeting.",
			audioUrl: "",
			durationMs: 4200,
		},
		{
			prompt: "What are your main duties?",
			reference:
				"I maintain our payment infrastructure and keep transaction APIs reliable during peak hours.",
			audioUrl: "",
			durationMs: 5200,
		},
		{
			prompt: "How do you handle blockers?",
			reference:
				"I work closely with product managers to resolve blockers before the deployment window.",
			audioUrl: "",
			durationMs: 5000,
		},
		{
			prompt: "Why is communication important?",
			reference:
				"Clear communication is just as crucial as writing clean code.",
			audioUrl: "",
			durationMs: 3600,
		},
	],
};

export const WRITING_PAYLOAD: WritingPayload = {
	title: "Describe your current job",
	minWords: 60,
	maxWords: 100,
	contextQuestions: [
		"What do you do?",
		"What are you responsible for?",
		"What are you working on now?",
	],
};

export const VOICE_PAYLOAD: VoicePayload = { scenarioId: "scenario-01" };

/** Which roleplay scenario each voice part starts with. */
export const VOICE_SCENARIO_BY_LESSON: Record<string, string> = {
	"describing-your-job": "scenario-01",
	"leading-sprint-reviews": "scenario-05",
	"de-escalating-team-tensions": "scenario-07",
	"negotiating-project-timelines": "scenario-04",
};

const DEFAULT_VOICE_SCENARIO_ID = "scenario-04";

function payloadFor(type: ActivityType, lessonId: string): Partial<Activity> {
	switch (type) {
		case "reading":
			return { reading: READING_PAYLOAD };
		case "dictation":
			return { dictation: DICTATION_PAYLOAD };
		case "writing":
			return { writing: WRITING_PAYLOAD };
		case "voice":
			return {
				voice: {
					scenarioId:
						VOICE_SCENARIO_BY_LESSON[lessonId] ?? DEFAULT_VOICE_SCENARIO_ID,
				},
			};
	}
}

const OUTCOMES = [
	"Describe what you do at work with natural phrasing instead of mechanical translations.",
	'Clearly articulate your core responsibilities using functional phrases like "I\'m responsible for..." and "I mainly deal with...".',
	"Confidently discuss current projects, milestone timelines, and daily cross-team collaboration.",
];

export const LESSON_DETAILS: Record<string, LessonDetailFixture> =
	Object.fromEntries(
		LESSONS.map((lesson) => [
			lesson.id,
			{
				lesson,
				activities: BLUEPRINTS.slice(0, lesson.partCount).map(
					(blueprint, index) => ({
						id: `${lesson.id}-part-${index + 1}`,
						partNumber: index + 1,
						type: blueprint.type,
						title: blueprint.title,
						description: blueprint.description,
						durationMin: blueprint.durationMin,
						skillFocus: blueprint.skillFocus,
						...payloadFor(blueprint.type, lesson.id),
					}),
				),
				outcomes: OUTCOMES,
			},
		]),
	);

export function getLessonById(id: string): Lesson | undefined {
	return LESSONS.find((lesson) => lesson.id === id);
}

export function getLessonDetail(id: string): LessonDetailFixture | undefined {
	return LESSON_DETAILS[id];
}

/** Does this lesson actually have an activity for `part`? (partCount trims the blueprints) */
export function hasActivityForPart(lessonId: string, part: string): boolean {
	return Boolean(
		LESSON_DETAILS[lessonId]?.activities.some(
			(activity) => activity.type === part,
		),
	);
}
