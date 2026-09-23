import type { Scenario, ScenarioDifficulty } from "@engflex/contracts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { Search } from "lucide-react";
import { useState } from "react";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb } from "#/app/breadcrumbs";
import { PageHeader } from "#/components/common/page-header";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { CustomScenarioBanner } from "#/features/voice/components/custom-scenario-banner";
import { ScenarioCard } from "#/features/voice/components/scenario-card";
import { TopicBanner } from "#/features/voice/components/topic-banner";
import { SCENARIO_TOPICS, TOPIC_IMAGES } from "#/features/voice/fixtures";
import {
	addCustomScenario,
	startSession,
	voiceSessionStore,
} from "#/features/voice/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/voice/scenarios")({
	staticData: breadcrumb([
		{ label: () => m["nav.voice"](), target: { to: APP_ROUTES.VOICE } },
		() => m["voice.crumbScenarios"](),
	]),
	component: ScenariosPage,
});

const DIFFICULTY_OPTIONS: Array<{
	value: "all" | ScenarioDifficulty;
	label: string | (() => string);
}> = [
	{ value: "all", label: () => m["voice.filterAllDifficulties"]() },
	{ value: "B1+", label: "B1+" },
	{ value: "B2", label: "B2" },
	{ value: "C1", label: "C1" },
];

function ScenariosPage() {
	const navigate = useNavigate();
	const [difficulty, setDifficulty] = useState<"all" | ScenarioDifficulty>(
		"all",
	);
	const [search, setSearch] = useState("");
	const customScenarios = useStore(
		voiceSessionStore,
		(state) => state.customScenarios,
	);

	const matches = (scenario: Scenario) => {
		if (difficulty !== "all" && scenario.cefrLevel !== difficulty) return false;
		if (search.trim()) {
			const haystack = `${scenario.title} ${scenario.objective}`.toLowerCase();
			if (!haystack.includes(search.trim().toLowerCase())) return false;
		}
		return true;
	};

	const visibleTopics = SCENARIO_TOPICS.map((topic) => ({
		topic,
		scenarios: topic.scenarios.filter(matches),
	})).filter((entry) => entry.scenarios.length > 0);

	const visibleCustom = customScenarios.filter(matches);

	const totalVisible =
		visibleTopics.reduce((sum, entry) => sum + entry.scenarios.length, 0) +
		visibleCustom.length;

	function start(scenario: Scenario) {
		startSession("roleplay", scenario.id);
		navigate({ to: "/voice/room" });
	}

	return (
		<div className="container-content flex flex-col gap-6 py-8">
			<PageHeader
				title={m["voice.scenariosTitle"]()}
				subtitle={m["voice.scenariosSubtitle"]()}
			/>

			<div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
				<div className="relative">
					<Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={m["voice.filterSearch"]()}
						className="pl-8"
					/>
				</div>
				<Select
					value={difficulty}
					onValueChange={(value) =>
						setDifficulty(value as "all" | ScenarioDifficulty)
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{DIFFICULTY_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{typeof option.label === "function"
									? option.label()
									: option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{totalVisible === 0 ? (
				<Empty className="rounded-xl border bg-card">
					<EmptyHeader>
						<EmptyTitle>{m["voice.emptyTitle"]()}</EmptyTitle>
					</EmptyHeader>
					<EmptyContent>
						<Button
							variant="outline"
							onClick={() => {
								setDifficulty("all");
								setSearch("");
							}}
						>
							{m["common.resetFilters"]()}
						</Button>
					</EmptyContent>
				</Empty>
			) : null}

			{visibleTopics.map(({ topic, scenarios }) => (
				<section key={topic.id} className="flex flex-col gap-3">
					<TopicBanner
						name={topic.name}
						image={TOPIC_IMAGES[topic.slug] ?? ""}
					/>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{scenarios.map((scenario) => (
							<ScenarioCard
								key={scenario.id}
								scenario={scenario}
								onStart={() => start(scenario)}
							/>
						))}
					</div>
				</section>
			))}

			{visibleCustom.length > 0 ? (
				<section className="flex flex-col gap-3">
					<h2 className="text-lg font-bold tracking-tight text-foreground">
						{m["voice.customSection"]()}
					</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{visibleCustom.map((scenario) => (
							<ScenarioCard
								key={scenario.id}
								scenario={scenario}
								onStart={() => start(scenario)}
							/>
						))}
					</div>
				</section>
			) : null}

			<CustomScenarioBanner onCreate={addCustomScenario} />
		</div>
	);
}
