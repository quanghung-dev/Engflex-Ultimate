import { RedirectToSignIn, Show } from "@clerk/tanstack-react-start";
import type {
	Goal,
	InterestTopic,
	Level,
	Preferences,
} from "@engflex/contracts";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import {
	AudioWaveform,
	BadgeCheck,
	Brain,
	Briefcase,
	Coffee,
	GraduationCap,
	type LucideIcon,
	Plane,
	Smile,
} from "lucide-react";
import { useState } from "react";
import { breadcrumb } from "#/app/breadcrumbs";
import { Button } from "#/components/ui/button";
import { FieldError } from "#/components/ui/field";
import { RadioGroup } from "#/components/ui/radio-group";
import { ToggleGroup } from "#/components/ui/toggle-group";
import { DiagnosticMilestoneCard } from "#/features/onboarding/components/diagnostic-milestone-card";
import { FlowHeader } from "#/features/onboarding/components/flow-header";
import { GoalChip } from "#/features/onboarding/components/goal-chip";
import { LevelRadioCard } from "#/features/onboarding/components/level-radio-card";
import {
	type Slide,
	SlideTrack,
} from "#/features/onboarding/components/slide-track";
import { TimeCommitmentCard } from "#/features/onboarding/components/time-commitment-card";
import { TopicChip } from "#/features/onboarding/components/topic-chip";
import { profileStore, setPreferences } from "#/features/profiles/store";
import { getAuthState } from "#/lib/auth-guard";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/onboarding")({
	staticData: breadcrumb(() => m["onboarding.crumb"]()),
	beforeLoad: async () => {
		const { isAuthenticated } = await getAuthState();
		if (!isAuthenticated) {
			throw redirect({ href: "/sign-in" });
		}
	},
	component: OnboardingPage,
});

const LEVELS: Array<{
	value: Level;
	range: string;
	title: () => string;
	description: () => string;
	hint: () => string;
	hintIcon: LucideIcon;
}> = [
	{
		value: "beginner",
		range: "A1–A2",
		title: () => m["onboarding.levels.beginner.title"](),
		description: () => m["onboarding.levels.beginner.description"](),
		hint: () => m["onboarding.levels.beginner.hint"](),
		hintIcon: AudioWaveform,
	},
	{
		value: "intermediate",
		range: "B1–B2",
		title: () => m["onboarding.levels.intermediate.title"](),
		description: () => m["onboarding.levels.intermediate.description"](),
		hint: () => m["onboarding.levels.intermediate.hint"](),
		hintIcon: BadgeCheck,
	},
	{
		value: "advanced",
		range: "C1–C2",
		title: () => m["onboarding.levels.advanced.title"](),
		description: () => m["onboarding.levels.advanced.description"](),
		hint: () => m["onboarding.levels.advanced.hint"](),
		hintIcon: Brain,
	},
];

const GOALS: Array<{ value: Goal; label: () => string; icon: LucideIcon }> = [
	{ value: "travel", label: () => m["onboarding.goals.travel"](), icon: Plane },
	{
		value: "work",
		label: () => m["onboarding.goals.work"](),
		icon: Briefcase,
	},
	{
		value: "exams",
		label: () => m["onboarding.goals.exams"](),
		icon: GraduationCap,
	},
	{
		value: "daily",
		label: () => m["onboarding.goals.daily"](),
		icon: Coffee,
	},
	{ value: "fun", label: () => m["onboarding.goals.fun"](), icon: Smile },
];

const TOPICS: Array<{ value: InterestTopic; label: () => string }> = [
	{ value: "travel", label: () => m["onboarding.topics.travel"]() },
	{ value: "business", label: () => m["onboarding.topics.business"]() },
	{ value: "movies_tv", label: () => m["onboarding.topics.movies_tv"]() },
	{ value: "technology", label: () => m["onboarding.topics.technology"]() },
	{ value: "food", label: () => m["onboarding.topics.food"]() },
	{ value: "music", label: () => m["onboarding.topics.music"]() },
	{ value: "sports", label: () => m["onboarding.topics.sports"]() },
	{ value: "news", label: () => m["onboarding.topics.news"]() },
];

const COMMITMENTS = [
	{
		minutes: 5,
		label: () => m["onboarding.commitments.c5.label"](),
		sub: () => m["onboarding.commitments.c5.sub"](),
	},
	{
		minutes: 10,
		label: () => m["onboarding.commitments.c10.label"](),
		sub: () => m["onboarding.commitments.c10.sub"](),
	},
	{
		minutes: 15,
		label: () => m["onboarding.commitments.c15.label"](),
		sub: () => m["onboarding.commitments.c15.sub"](),
		recommended: true,
	},
	{
		minutes: 30,
		label: () => m["onboarding.commitments.c30.label"](),
		sub: () => m["onboarding.commitments.c30.sub"](),
	},
];

function OnboardingPage() {
	const navigate = useNavigate();
	const stored = useStore(profileStore, (state) => state.profile.preferences);
	const [slide, setSlide] = useState(0);
	const [draft, setDraft] = useState<Preferences>(() => ({ ...stored }));
	const [topicError, setTopicError] = useState<string | null>(null);

	function next() {
		if (slide === 1 && draft.topics.length < 2) {
			setTopicError(m["onboarding.topicsError"]());
			return;
		}
		setTopicError(null);
		setSlide((current) => Math.min(3, current + 1));
	}

	function back() {
		setSlide((current) => Math.max(0, current - 1));
	}

	function finish() {
		setPreferences(draft);
		navigate({ to: "/" });
	}

	const slides: Slide[] = [
		{
			key: "level",
			node: (
				<section className="flex flex-col gap-4 p-5">
					<div>
						<h2 className="text-lg font-extrabold tracking-tight">
							{m["onboarding.levelTitle"]()}
						</h2>
						<p className="mt-1 text-xs text-muted-foreground">
							{m["onboarding.levelSubtitle"]()}
						</p>
					</div>
					<RadioGroup
						value={draft.level}
						onValueChange={(value) =>
							setDraft((current) => ({ ...current, level: value as Level }))
						}
						className="flex flex-col gap-3"
					>
						{LEVELS.map((level) => (
							<LevelRadioCard
								key={level.value}
								value={level.value}
								range={level.range}
								title={level.title()}
								description={level.description()}
								hint={level.hint()}
								hintIcon={level.hintIcon}
								selected={draft.level === level.value}
							/>
						))}
					</RadioGroup>
				</section>
			),
		},
		{
			key: "goal",
			node: (
				<section className="flex flex-col gap-5 p-5">
					<div>
						<h2 className="text-lg font-extrabold tracking-tight">
							{m["onboarding.goalTitle"]()}
						</h2>
						<p className="mt-1 text-xs text-muted-foreground">
							{m["onboarding.goalSubtitle"]()}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{GOALS.map((goal) => (
							<GoalChip
								key={goal.value}
								value={goal.value}
								label={goal.label()}
								icon={goal.icon}
								selected={draft.primaryGoal === goal.value}
								onSelect={(value) =>
									setDraft((current) => ({ ...current, primaryGoal: value }))
								}
							/>
						))}
					</div>
					<div className="flex flex-col gap-2">
						<h3 className="text-sm font-semibold">
							{m["onboarding.topicsTitle"]()}
						</h3>
						<p className="text-xs text-muted-foreground">
							{m["onboarding.topicsSubtitle"]()}
						</p>
						<ToggleGroup
							type="multiple"
							value={draft.topics}
							onValueChange={(value) => {
								setDraft((current) => ({
									...current,
									topics: value as InterestTopic[],
								}));
								if (value.length >= 2) setTopicError(null);
							}}
							className="flex flex-wrap justify-start gap-2"
						>
							{TOPICS.map((topic) => (
								<TopicChip
									key={topic.value}
									value={topic.value}
									label={topic.label()}
								/>
							))}
						</ToggleGroup>
						{topicError ? <FieldError>{topicError}</FieldError> : null}
					</div>
				</section>
			),
		},
		{
			key: "time",
			node: (
				<section className="flex flex-col gap-4 p-5">
					<div>
						<h2 className="text-lg font-extrabold tracking-tight">
							{m["onboarding.timeTitle"]()}
						</h2>
						<p className="mt-1 text-xs text-muted-foreground">
							{m["onboarding.timeSubtitle"]()}
						</p>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						{COMMITMENTS.map((commitment) => (
							<TimeCommitmentCard
								key={commitment.minutes}
								minutes={commitment.minutes}
								label={commitment.label()}
								sub={commitment.sub()}
								recommended={commitment.recommended}
								selected={draft.dailyCommitmentMin === commitment.minutes}
								onSelect={(minutes) =>
									setDraft((current) => ({
										...current,
										dailyCommitmentMin: minutes,
									}))
								}
							/>
						))}
					</div>
				</section>
			),
		},
		{ key: "result", node: <DiagnosticMilestoneCard /> },
	];

	return (
		<>
			<Show when="signed-in">
				<div className="grid-bg flex min-h-svh items-center justify-center p-4 sm:p-6">
					<div className="container-narrow w-full rounded-2xl border bg-card shadow-sm">
						<FlowHeader />
						<SlideTrack index={slide} slides={slides} />
						<div className="flex items-center justify-between border-t p-4">
							<Button
								type="button"
								variant="ghost"
								onClick={back}
								disabled={slide === 0}
							>
								{m["common.back"]()}
							</Button>
							<Button type="button" onClick={slide === 3 ? finish : next}>
								{slide === 3 ? m["common.finish"]() : m["common.continue"]()}
							</Button>
						</div>
					</div>
				</div>
			</Show>
			<Show when="signed-out">
				<RedirectToSignIn />
			</Show>
		</>
	);
}
