import { createFileRoute } from "@tanstack/react-router";
import { History, TrendingUp } from "lucide-react";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageHero } from "#/components/common/page-layout";
import {
	ToeicCategoryCard,
	type ToeicCategoryCardItem,
} from "#/features/exams/components/toeic-category-card";
import {
	type ToeicAttemptItem,
	ToeicHistoryPanel,
} from "#/features/exams/components/toeic-history-panel";
import {
	type ToeicStats,
	ToeicStatsPanel,
} from "#/features/exams/components/toeic-stats-panel";
import { m } from "#/paraglide/messages";

const MOCK_CATEGORIES: ToeicCategoryCardItem[] = [
	{
		id: "parroto-vol-1",
		title: "Bộ đề Parroto TOEIC Practice Vol. 1",
		tags: ["parroto", "2026"],
		testsCount: 10,
		attemptsCount: 90459,
		iconBgColor: "bg-[#0284c7]",
	},
	{
		id: "toeic-2026",
		title: "Bộ đề TOEIC 2026",
		tags: ["TOEIC", "2026"],
		testsCount: 10,
		attemptsCount: 206081,
		iconBgColor: "bg-[#ea580c]",
	},
	{
		id: "toeic-2024",
		title: "Bộ đề TOEIC 2024",
		tags: ["TOEIC", "2024"],
		testsCount: 10,
		attemptsCount: 29398,
		iconBgColor: "bg-[#9333ea]",
	},
	{
		id: "toeic-2023",
		title: "Bộ đề TOEIC 2023",
		tags: ["TOEIC", "2023"],
		testsCount: 10,
		attemptsCount: 27835,
		iconBgColor: "bg-[#2563eb]",
	},
];

const MOCK_STATS: ToeicStats = {
	completedTests: 1,
	highestScore: 0,
	averageScore: 0,
	latestScore: 0,
};

const MOCK_ATTEMPTS: ToeicAttemptItem[] = [
	{
		id: "attempt-1",
		title: "Parroto TOEIC Practice Vol. 1 - Test 1",
		mode: "exam",
		status: "in_progress",
		date: "30-10",
	},
	{
		id: "attempt-2",
		title: "TOEIC 2026 - Test 3",
		mode: "practice",
		status: "completed",
		date: "08-07",
		scorePct: 63,
	},
];

export const Route = createFileRoute("/_app/exams/toeic/")({
	component: ToeicHubPage,
});

function ToeicHubPage() {
	useBreadcrumbs([{ label: m["exams.toeic.hub.title"]() }]);

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
			{/* Page Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
				<PageHero
					icon={<MoMascot variant="nice" size={84} />}
					title={m["exams.toeic.hub.title"]()}
					description={m["exams.toeic.hub.description"]()}
				/>

				<div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-4">
					<button
						type="button"
						className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-700"
					>
						<History className="size-4" aria-hidden="true" />
						<span>{m["exams.toeic.hub.historyButton"]()}</span>
					</button>
					<button
						type="button"
						className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
					>
						<TrendingUp className="size-4" aria-hidden="true" />
						<span>{m["exams.toeic.hub.analyticsButton"]()}</span>
					</button>
				</div>
			</div>

			{/* Category Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{MOCK_CATEGORIES.map((category) => (
					<ToeicCategoryCard key={category.id} item={category} />
				))}
			</div>

			{/* Bottom Analytics & History Section */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<ToeicStatsPanel stats={MOCK_STATS} />
				<ToeicHistoryPanel attempts={MOCK_ATTEMPTS} />
			</div>
		</div>
	);
}
