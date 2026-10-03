import type {
	CreateCustomScenario,
	Scenario,
	ScenarioDifficulty,
} from "@engflex/contracts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { cn } from "cn";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb } from "#/app/breadcrumbs";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageLayout } from "#/components/common/page-layout";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { Input } from "#/components/ui/input";
import {
	LESSON_META,
	LESSONS,
	VOICE_SCENARIO_BY_LESSON,
} from "#/features/lessons/fixtures";
import { lessonsStore } from "#/features/lessons/store";
import { CustomScenarioBanner } from "#/features/voice/components/scenarios/custom-scenario-banner";
import { ScenarioCard } from "#/features/voice/components/scenarios/scenario-card";
import { getScenario, SCENARIO_TOPICS } from "#/features/voice/fixtures";
import {
	useCreateConversation,
	useCreateScenario,
	useScenarios,
} from "#/features/voice/queries";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/voice/scenarios")({
	staticData: breadcrumb([
		{
			label: () => m["nav.item.voice"](),
			target: { to: APP_ROUTES.VOICE.LIST },
		},
		() => m["voice.crumb.scenarios"](),
	]),
	component: ScenariosPage,
});

const LEVELS: Array<"all" | ScenarioDifficulty> = ["all", "B1+", "B2", "C1"];

function levelLabel(level: (typeof LEVELS)[number]): string {
	if (level === "all") return m["voice.scenarios.level.any"]();
	return level;
}

function ScenariosPage() {
	const navigate = useNavigate();
	const [difficulty, setDifficulty] = useState<"all" | ScenarioDifficulty>(
		"all",
	);
	const [topic, setTopic] = useState<string>("all");
	const [search, setSearch] = useState("");
	// Custom scenarios come from the API (real UUIDs); built-in sections stay
	// on fixtures until seed data exists — the database ships empty and the
	// API exposes no topic names to group a server-driven browser by.
	const customQuery = useScenarios({ scope: "custom" });
	const customScenarios = customQuery.data?.items ?? [];

	const lessonState = useStore(lessonsStore);
	const activeSlot = (() => {
		for (const [lessonId, meta] of Object.entries(LESSON_META)) {
			const completed = lessonState.completedParts[lessonId] ?? [];
			const total =
				LESSONS.find((lesson) => lesson.id === lessonId)?.partCount ?? 0;
			if (completed.length > 0 && completed.length < total) {
				return {
					slot: meta.slot,
					scenarioId: VOICE_SCENARIO_BY_LESSON[lessonId],
				};
			}
		}
		return null;
	})();
	const suggested: Scenario | undefined =
		(activeSlot?.scenarioId ? getScenario(activeSlot.scenarioId) : undefined) ??
		getScenario("scenario-05");

	const matches = (scenario: Scenario) => {
		if (difficulty !== "all" && scenario.cefrLevel !== difficulty) return false;
		if (topic !== "all" && scenario.topicId !== topic) return false;
		if (search.trim()) {
			const haystack = `${scenario.title} ${scenario.objective}`.toLowerCase();
			if (!haystack.includes(search.trim().toLowerCase())) return false;
		}
		return true;
	};

	const visibleTopics = SCENARIO_TOPICS.map((topicEntry) => ({
		topic: topicEntry,
		scenarios: topicEntry.scenarios.filter(matches),
	})).filter((entry) => entry.scenarios.length > 0);

	const visibleCustom = customScenarios.filter(matches);

	const totalVisible =
		visibleTopics.reduce((sum, entry) => sum + entry.scenarios.length, 0) +
		visibleCustom.length;

	const createConversation = useCreateConversation();
	const createScenario = useCreateScenario();

	async function createAndStart(input: CreateCustomScenario) {
		const scenario = await createScenario.mutateAsync(input);
		await startRoleplay(scenario.id);
	}

	async function startRoleplay(scenarioId: string) {
		if (createConversation.isPending) return;
		try {
			const conversation = await createConversation.mutateAsync({
				mode: "roleplay",
				scenarioId,
			});
			await navigate({
				to: APP_ROUTES.VOICE.ROOM,
				params: { conversationId: conversation.id },
			});
		} catch {
			toast.error(m["voice.create.failed"]());
		}
	}

	return (
		<PageLayout
			hero={{
				icon: <MoMascot variant="open" size={64} />,
				title: m["voice.scenarios.title"](),
				description: m["voice.scenarios.subtitle"](),
			}}
		>
			{suggested ? (
				<section className="surface-hero flex flex-col gap-4 p-5 md:flex-row md:items-center">
					<div className="min-w-0 flex-1">
						<p className="text-[11px] font-bold text-muted-foreground">
							{activeSlot
								? m["voice.scenarios.suggestLine"]({ slot: activeSlot.slot })
								: m["voice.scenarios.title"]()}
						</p>
						<h2 className="mt-1 text-xl font-bold text-foreground">
							{suggested.title}
						</h2>
						<p className="mt-1 text-[15px] font-medium text-muted-foreground">
							{suggested.objective}
						</p>
						<div className="mt-3">
							<Button
								type="button"
								className="btn btn-primary"
								onClick={() => {
									void startRoleplay(suggested.id);
								}}
							>
								{m["voice.scenarios.startOne"]()}
							</Button>
						</div>
					</div>
					<MoMascot variant="heart" size={110} className="mx-auto shrink-0" />
				</section>
			) : null}

			<div className="flex flex-col gap-3">
				<div className="relative">
					<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={m["voice.scenarios.filter.search"]()}
						className="field pl-9"
					/>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-[11px] font-bold text-muted-foreground">
						{m["voice.scenarios.topic.label"]()}
					</span>
					<button
						type="button"
						onClick={() => setTopic("all")}
						className={cn(
							"chip px-3 py-1 text-xs transition",
							topic === "all" ? "chip-selected" : "hover:border-primary",
						)}
					>
						{m["voice.scenarios.topic.all"]()}
					</button>
					{SCENARIO_TOPICS.map((topicEntry) => (
						<button
							key={topicEntry.id}
							type="button"
							onClick={() => setTopic(topicEntry.id)}
							className={cn(
								"chip px-3 py-1 text-xs transition",
								topic === topicEntry.id
									? "chip-selected"
									: "hover:border-primary",
							)}
						>
							{topicEntry.name}
						</button>
					))}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-[11px] font-bold text-muted-foreground">
						{m["voice.scenarios.level.label"]()}
					</span>
					{LEVELS.map((level) => (
						<button
							key={level}
							type="button"
							onClick={() => setDifficulty(level)}
							className={cn(
								"chip px-3 py-1 text-xs transition",
								difficulty === level ? "chip-selected" : "hover:border-primary",
							)}
						>
							{levelLabel(level)}
						</button>
					))}
				</div>
			</div>

			{totalVisible === 0 ? (
				<Empty className="surface-card items-center text-center">
					<MoMascot variant="confused" size={72} />
					<EmptyHeader>
						<EmptyTitle>{m["voice.scenarios.emptyTitle"]()}</EmptyTitle>
					</EmptyHeader>
					<EmptyContent>
						<Button
							variant="outline"
							className="btn btn-outline"
							onClick={() => {
								setDifficulty("all");
								setTopic("all");
								setSearch("");
							}}
						>
							{m["common.actions.resetFilters"]()}
						</Button>
					</EmptyContent>
				</Empty>
			) : null}

			{visibleTopics.map(({ topic: topicEntry, scenarios }) => (
				<section key={topicEntry.id} className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-3">
							<span
								className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-primary text-sm font-bold text-primary-foreground"
								style={{ boxShadow: "0 2px 0 #433095" }}
							>
								{topicEntry.position}
							</span>
							<h2 className="truncate text-lg font-bold text-foreground">
								{topicEntry.name}
							</h2>
						</div>
						<span className="shrink-0 text-xs font-bold text-muted-foreground">
							{m["voice.scenarios.count"]({ count: scenarios.length })}
						</span>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{scenarios.map((scenario) => (
							<ScenarioCard
								key={scenario.id}
								scenario={scenario}
								onStart={() => {
									void startRoleplay(scenario.id);
								}}
							/>
						))}
					</div>
				</section>
			))}

			{visibleCustom.length > 0 ? (
				<section className="flex flex-col gap-3">
					<h2 className="text-lg font-bold text-foreground">
						{m["voice.custom.section"]()}
					</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{visibleCustom.map((scenario) => (
							<ScenarioCard
								key={scenario.id}
								scenario={scenario}
								onStart={() => {
									void startRoleplay(scenario.id);
								}}
							/>
						))}
					</div>
				</section>
			) : null}

			<CustomScenarioBanner onCreate={(input) => createAndStart(input)} />
		</PageLayout>
	);
}
