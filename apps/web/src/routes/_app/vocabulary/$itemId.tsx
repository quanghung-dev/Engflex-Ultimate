import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { ArrowLeft } from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { PageLayout } from "#/components/common/page-layout";
import { Button } from "#/components/ui/button";
import { AcousticBreakdownCard } from "#/features/vocabulary/components/acoustic-breakdown-card";
import { CollocationsGrid } from "#/features/vocabulary/components/collocations-grid";
import { ContextsSection } from "#/features/vocabulary/components/contexts-section";
import { MorphologyCard } from "#/features/vocabulary/components/morphology-card";
import { PersonalNoteCard } from "#/features/vocabulary/components/personal-note-card";
import { WordHeroCard } from "#/features/vocabulary/components/word-hero-card";
import {
	getVocabularyItem,
	vocabularyStore,
} from "#/features/vocabulary/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/vocabulary/$itemId")({
	beforeLoad: ({ params }) => {
		if (!getVocabularyItem(params.itemId)) {
			throw redirect({ to: APP_ROUTES.VOCABULARY.LIST });
		}
	},
	component: WordDetailPage,
});

function WordDetailPage() {
	const { itemId } = Route.useParams();
	useStore(vocabularyStore); // subscribe to mastered/note changes
	const item = getVocabularyItem(itemId);
	useBreadcrumbs(
		item
			? [
					{ label: m["nav.item.vocabulary"](), to: APP_ROUTES.VOCABULARY.LIST },
					{ label: item.term },
				]
			: [],
	);

	if (!item) return null;
	const details = item.details;

	return (
		<PageLayout
			action={
				<Button asChild variant="ghost" size="sm" className="w-fit">
					<Link to={APP_ROUTES.VOCABULARY.LIST}>
						<ArrowLeft data-icon="inline-start" />
						{m["common.actions.back"]()}
					</Link>
				</Button>
			}
		>
			<WordHeroCard item={item} />

			{details ? (
				<>
					<ContextsSection term={item.term} contexts={details.contexts} />
					<CollocationsGrid collocations={details.collocations} />
					<div className="grid gap-5 lg:grid-cols-2">
						<MorphologyCard
							wordForms={details.wordForms}
							etymology={details.etymology}
						/>
						<AcousticBreakdownCard
							syllables={details.syllables}
							stressTip={details.stressTip}
							commonSlip={details.commonSlip}
						/>
					</div>
					{details.longDefinition ? (
						<section className="rounded-xl border bg-card p-5">
							<h2 className="text-sm font-bold tracking-tight text-foreground">
								{m["vocabulary.card.fullDefinition"]()}
							</h2>
							<p className="mt-2 text-sm text-muted-foreground">
								{details.longDefinition}
							</p>
						</section>
					) : null}
				</>
			) : null}

			{item.userState ? (
				<PersonalNoteCard
					itemId={item.id}
					note={item.userState.note}
					createdAt={item.userState.createdAt}
				/>
			) : null}
		</PageLayout>
	);
}
