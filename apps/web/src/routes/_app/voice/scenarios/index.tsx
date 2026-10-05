import type { Scenario, ScenarioDifficulty } from "@engflex/contracts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { cn } from "cn";
import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb } from "#/app/breadcrumbs";
import { EmptyList } from "#/components/common/empty-list";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageLayout } from "#/components/common/page-layout";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	LESSON_META,
	LESSONS,
	VOICE_SCENARIO_BY_LESSON,
} from "#/features/lessons/fixtures";
import { lessonsStore } from "#/features/lessons/store";
import { ScenarioCard } from "#/features/voice/components/scenarios/scenario-card";
import { useTopicsWithPreview } from "#/features/voice/queries";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/voice/scenarios/")({
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
	// Server filters difficulty/search inside the single join; the deferred
	// value keeps per-keystroke queries out of the cache key.
	const deferredSearch = useDeferredValue(search.trim());
	const topicsQuery = useTopicsWithPreview({
		difficulty: difficulty === "all" ? undefined : difficulty,
		search: deferredSearch || undefined,
	});
	// Banners arrive nested — each topic carries its own top-k scenarios — so the
	// page renders what it got. A topic with no matching scenario keeps an
	// empty `scenarios`, which is why the filter chips never disappear.
	const topics = topicsQuery.data ?? [];
	// Catalog failure is terminal (no retry by query design): say so once
	// and leave the filters usable instead of spinning.
	const topicsFailed = topicsQuery.isError;
	useEffect(() => {
		if (topicsFailed) {
			toast.error(m["voice.scenarios.topicsFailed"]());
		}
	}, [topicsFailed]);
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
	// Server data only: fixture ids are not UUIDs and cannot start a
	// session, so there is no fixture fallback. The hero hides while the
	// catalog loads.
	const suggested: Scenario | undefined = topics[0]?.scenarios[0];

	const visibleTopics = topics.filter(
		(topicEntry) => topic === "all" || topicEntry.id === topic,
	);

	const totalVisible = visibleTopics.reduce(
		(sum, entry) => sum + entry.scenarios.length,
		0,
	);

	function openDetail(scenarioId: string) {
		void navigate({
			to: APP_ROUTES.VOICE.SCENARIO,
			params: { scenarioId },
		});
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
									void openDetail(suggested.id);
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
					{topics.map((topicEntry) => (
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

			{!topicsQuery.isPending && totalVisible === 0 ? (
				<EmptyList
					title={m["voice.scenarios.emptyTitle"]()}
					onReset={() => {
						setDifficulty("all");
						setTopic("all");
						setSearch("");
					}}
				/>
			) : null}

			{visibleTopics.map((topicEntry) => (
				<section key={topicEntry.id} className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-3">
							<span
								className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-primary text-sm font-bold text-primary-foreground"
								style={{ boxShadow: "0 2px 0 #433095" }}
							>
								{topics.findIndex((t) => t.id === topicEntry.id) + 1}
							</span>
							<h2 className="truncate text-lg font-bold text-foreground">
								{topicEntry.name}
							</h2>
						</div>
						<span className="shrink-0 text-xs font-bold text-muted-foreground">
							{m["voice.scenarios.count"]({
								count: topicEntry.scenarios.length,
							})}
						</span>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{topicEntry.scenarios.map((scenario) => (
							<ScenarioCard
								key={scenario.id}
								scenario={scenario}
								onStart={() => {
									void openDetail(scenario.id);
								}}
							/>
						))}
					</div>
				</section>
			))}
		</PageLayout>
	);
}
