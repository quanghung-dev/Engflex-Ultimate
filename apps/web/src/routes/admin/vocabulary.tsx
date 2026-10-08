import { createFileRoute } from "@tanstack/react-router";
import { breadcrumb } from "#/app/breadcrumbs";
import { AdminPage } from "#/features/admin/components/admin-page";
import {
	VocabularyCategoriesPanel,
	VocabularyDecksPanel,
	VocabularyItemsPanel,
} from "#/features/admin/components/vocabulary-panels";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/admin/vocabulary")({
	staticData: breadcrumb(() => m["admin.nav.vocabulary"]()),
	component: AdminVocabularyPage,
});

function AdminVocabularyPage() {
	return (
		<AdminPage
			title={m["admin.vocabulary.title"]()}
			subtitle={m["admin.vocabulary.subtitle"]()}
			tabs={[
				{
					value: "items",
					label: m["admin.vocabulary.tabs.items"](),
					content: <VocabularyItemsPanel />,
				},
				{
					value: "decks",
					label: m["admin.vocabulary.tabs.decks"](),
					content: <VocabularyDecksPanel />,
				},
				{
					value: "categories",
					label: m["admin.vocabulary.tabs.categories"](),
					content: <VocabularyCategoriesPanel />,
				},
			]}
		/>
	);
}
