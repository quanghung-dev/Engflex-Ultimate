import { createFileRoute, redirect } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb, vocabularyCrumbLabel } from "#/app/breadcrumbs";
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
	staticData: breadcrumb([
		{
			label: () => m["nav.vocabulary"](),
			target: { to: APP_ROUTES.VOCABULARY },
		},
		vocabularyCrumbLabel,
	]),
	beforeLoad: ({ params }) => {
		if (!getVocabularyItem(params.itemId)) {
			throw redirect({ to: "/vocabulary" });
		}
	},
	component: WordDetailPage,
});

function WordDetailPage() {
	const { itemId } = Route.useParams();
	useStore(vocabularyStore); // subscribe to mastered/note changes
	const item = getVocabularyItem(itemId);

	if (!item) return null;
	const details = item.details;

	return (
		<div className="container-detail flex flex-col gap-5 py-8">
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
		</div>
	);
}
