import type { VocabularyItem } from "@engflex/contracts";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { BookmarkCheck, CircleCheck, LibraryBig, Pencil } from "lucide-react";
import { useState } from "react";
import { breadcrumb } from "#/app/breadcrumbs";
import { PageHeader } from "#/components/common/page-header";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { AddWordDialog } from "#/features/vocabulary/components/add-word-dialog";
import { RecallDeckWidget } from "#/features/vocabulary/components/recall-deck-widget";
import { RecentCustomWidget } from "#/features/vocabulary/components/recent-custom-widget";
import { VocabCard } from "#/features/vocabulary/components/vocab-card";
import {
	DEFAULT_VOCAB_FILTERS,
	VocabFilterBar,
	type VocabFilters,
} from "#/features/vocabulary/components/vocab-filter-bar";
import { VocabStatCard } from "#/features/vocabulary/components/vocab-stat-card";
import { VOCABULARY_STATS } from "#/features/vocabulary/fixtures";
import {
	getVocabularyItems,
	vocabularyStore,
} from "#/features/vocabulary/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/vocabulary/")({
	staticData: breadcrumb(() => m["nav.vocabulary"]()),
	component: VocabularyPage,
});

function VocabularyPage() {
	const [filters, setFilters] = useState<VocabFilters>(DEFAULT_VOCAB_FILTERS);
	useStore(vocabularyStore); // subscribe to mastered/note/add changes

	const items = getVocabularyItems();

	const visible = items.filter((item) => {
		if (filters.search.trim()) {
			const haystack = `${item.term} ${item.definition}`.toLowerCase();
			if (!haystack.includes(filters.search.trim().toLowerCase())) return false;
		}
		if (item.cefr !== filters.cefr && filters.cefr !== "all") return false;
		if (item.domain !== filters.domain && filters.domain !== "all")
			return false;
		if (
			item.userState?.sourceType !== filters.source &&
			filters.source !== "all"
		)
			return false;
		return true;
	});

	const sorted = [...visible];
	if (filters.sort === "alphabetical") {
		sorted.sort((a, b) => a.term.localeCompare(b.term));
	} else if (filters.sort === "mastery") {
		sorted.sort(
			(a, b) =>
				Number(b.userState?.mastered ?? false) -
				Number(a.userState?.mastered ?? false),
		);
	} else if (filters.sort === "interval") {
		sorted.sort((a, b) =>
			(a.userState?.srsDueAt ?? "9999").localeCompare(
				b.userState?.srsDueAt ?? "9999",
			),
		);
	}

	const customItems = items.filter(
		(item) => item.userState?.sourceType === "manual",
	);

	return (
		<div className="container-content flex flex-col gap-6 py-8">
			<PageHeader
				title={m["vocabulary.hubTitle"]()}
				subtitle={m["vocabulary.hubSubtitle"]()}
			/>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="text-sm font-semibold text-foreground">
					<span className="text-muted-foreground">
						{m["vocabulary.totalSaved"]()}{" "}
					</span>
					{VOCABULARY_STATS.totalSaved}
				</div>
				<AddWordDialog />
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<VocabStatCard
					label={m["vocabulary.stats.saved"]()}
					value={VOCABULARY_STATS.totalSaved}
					sub={m["vocabulary.stats.savedSub"]()}
					icon={LibraryBig}
				/>
				<VocabStatCard
					label={m["vocabulary.stats.mastered"]()}
					value={VOCABULARY_STATS.mastered}
					sub={m["vocabulary.stats.masteredSub"]({
						pct: VOCABULARY_STATS.retentionPct,
					})}
					icon={CircleCheck}
					tone="accuracy"
					retentionPct={VOCABULARY_STATS.retentionPct}
				/>
				<VocabStatCard
					label={m["vocabulary.stats.needsReview"]()}
					value={VOCABULARY_STATS.needsReview}
					sub={m["vocabulary.stats.needsReviewSub"]({
						count: VOCABULARY_STATS.dueToday,
					})}
					icon={BookmarkCheck}
					tone="violet"
				/>
				<VocabStatCard
					label={m["vocabulary.stats.custom"]()}
					value={VOCABULARY_STATS.customAdditions}
					sub={m["vocabulary.stats.customSub"]()}
					icon={Pencil}
				/>
			</div>

			<VocabFilterBar filters={filters} onChange={setFilters} />

			<div className="grid gap-4 lg:grid-cols-12">
				<div className="flex flex-col gap-4 lg:col-span-8">
					{sorted.length === 0 ? (
						<Empty className="rounded-xl border bg-card">
							<EmptyHeader>
								<EmptyTitle>{m["vocabulary.emptyTitle"]()}</EmptyTitle>
							</EmptyHeader>
							<EmptyContent>
								<Button
									variant="outline"
									onClick={() => setFilters(DEFAULT_VOCAB_FILTERS)}
								>
									{m["common.resetFilters"]()}
								</Button>
							</EmptyContent>
						</Empty>
					) : (
						sorted.map((item: VocabularyItem) => (
							<VocabCard key={item.id} item={item} />
						))
					)}
					<div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
						<span>
							{m["vocabulary.showing"]({
								shown: sorted.length,
								total: VOCABULARY_STATS.totalSaved,
							})}
						</span>
						<div className="flex items-center gap-2">
							<Button type="button" variant="outline" size="sm" disabled>
								{m["common.previousPage"]()}
							</Button>
							<Button type="button" variant="outline" size="sm" disabled>
								{m["common.nextPage"]()}
							</Button>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-4 lg:col-span-4">
					<RecallDeckWidget
						items={items}
						dueToday={VOCABULARY_STATS.dueToday}
					/>
					<RecentCustomWidget
						items={customItems}
						totalCustom={VOCABULARY_STATS.customAdditions}
						onViewAll={() =>
							setFilters((current) => ({ ...current, source: "manual" }))
						}
					/>
				</div>
			</div>
		</div>
	);
}
