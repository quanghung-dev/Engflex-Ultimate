import type {
	CEFR,
	VocabularyCategoryResponse,
	VocabularyDeckDetail,
	VocabularyDomain,
	VocabularyItem,
} from "@engflex/contracts";
import { useStore } from "@tanstack/react-store";
import { Badge } from "#/components/ui/badge";
import {
	cefrColumn,
	cefrOptions,
	dateColumn,
	fromNone,
	textColumn,
	titleColumn,
	withNone,
} from "#/features/admin/components/columns";
import { NONE } from "#/features/admin/components/resource-form-dialog";
import {
	type ResourceConfig,
	ResourcePanel,
} from "#/features/admin/components/resource-panel";
import { ADMIN_TODAY } from "#/features/admin/fixtures";
import {
	adminStore,
	newAdminId,
	removeRow,
	saveRow,
} from "#/features/admin/store";
import { m } from "#/paraglide/messages";

const DOMAIN_LABELS: Record<VocabularyDomain, () => string> = {
	backend_db: () => m["admin.vocabulary.items.domain.backendDb"](),
	distributed_systems: () =>
		m["admin.vocabulary.items.domain.distributedSystems"](),
	devops_cloud: () => m["admin.vocabulary.items.domain.devopsCloud"](),
	frontend_ui: () => m["admin.vocabulary.items.domain.frontendUi"](),
	ai_ml: () => m["admin.vocabulary.items.domain.aiMl"](),
};

/* ------------------------------------------------------------- items */

type ItemForm = {
	term: string;
	ipa: string;
	partOfSpeech: string;
	cefr: string;
	domain: string;
	definition: string;
};

const ITEM_CONFIG: ResourceConfig<VocabularyItem, ItemForm> = {
	noun: () => m["admin.vocabulary.items.noun"](),
	columns: [
		titleColumn(
			"term",
			() => m["admin.fields.term"](),
			(item) => item.term,
			(item) => item.ipa,
		),
		textColumn(
			"partOfSpeech",
			() => m["admin.fields.partOfSpeech"](),
			(item) => item.partOfSpeech,
		),
		cefrColumn((item) => item.cefr),
		textColumn(
			"domain",
			() => m["admin.fields.domain"](),
			(item) => (item.domain ? DOMAIN_LABELS[item.domain]() : undefined),
		),
		titleColumn(
			"definition",
			() => m["admin.fields.definition"](),
			(item) => item.definition,
		),
	],
	fields: [
		{
			name: "term",
			label: () => m["admin.fields.term"](),
			kind: "text",
			required: true,
		},
		{ name: "ipa", label: () => m["admin.fields.ipa"](), kind: "text" },
		{
			name: "partOfSpeech",
			label: () => m["admin.fields.partOfSpeech"](),
			kind: "text",
		},
		{
			name: "cefr",
			label: () => m["admin.fields.cefr"](),
			kind: "select",
			options: cefrOptions,
		},
		{
			name: "domain",
			label: () => m["admin.fields.domain"](),
			kind: "select",
			options: () =>
				withNone(
					(Object.keys(DOMAIN_LABELS) as VocabularyDomain[]).map((value) => ({
						value,
						label: DOMAIN_LABELS[value](),
					})),
				),
			full: true,
		},
		{
			name: "definition",
			label: () => m["admin.fields.definition"](),
			kind: "textarea",
			required: true,
		},
	],
	blank: () => ({
		term: "",
		ipa: "",
		partOfSpeech: "noun",
		cefr: "B2",
		domain: NONE,
		definition: "",
	}),
	toForm: (item) => ({
		term: item.term,
		ipa: item.ipa,
		partOfSpeech: item.partOfSpeech,
		cefr: item.cefr,
		domain: item.domain ?? NONE,
		definition: item.definition,
	}),
	fromForm: (values, item) => ({
		...item,
		id: item?.id ?? newAdminId("vocab"),
		term: values.term.trim(),
		ipa: values.ipa.trim(),
		partOfSpeech: values.partOfSpeech.trim(),
		cefr: values.cefr as CEFR,
		domain: fromNone(values.domain) as VocabularyDomain | undefined,
		definition: values.definition.trim(),
	}),
	label: (item) => item.term,
};

export function VocabularyItemsPanel() {
	const rows = useStore(adminStore, (state) => state.vocabularyItems);
	return (
		<ResourcePanel
			config={ITEM_CONFIG}
			rows={rows}
			onSave={(row) => saveRow("vocabularyItems", row)}
			onDelete={(row) => removeRow("vocabularyItems", row.id)}
		/>
	);
}

/* ------------------------------------------------------------- decks */

type DeckForm = {
	name: string;
	categoryId: string;
	level: string;
	isDefault: boolean;
	thumbnailUrl: string;
	description: string;
};

function deckConfig(
	categories: VocabularyCategoryResponse[],
): ResourceConfig<VocabularyDeckDetail, DeckForm> {
	const categoryName = (id: string | undefined) =>
		categories.find((category) => category.id === id)?.name;
	return {
		noun: () => m["admin.vocabulary.decks.noun"](),
		columns: [
			titleColumn(
				"name",
				() => m["admin.fields.name"](),
				(deck) => deck.name,
				(deck) => deck.description,
			),
			textColumn(
				"category",
				() => m["admin.fields.category"](),
				(deck) => categoryName(deck.categoryId),
			),
			cefrColumn(
				(deck) => (deck.level || undefined) as CEFR | undefined,
				() => m["admin.fields.level"](),
			),
			{
				id: "isDefault",
				header: () => m["admin.fields.isDefault"](),
				accessorFn: (deck) => (deck.isDefault ? 1 : 0),
				enableGlobalFilter: false,
				cell: ({ row }) =>
					row.original.isDefault ? (
						<Badge variant="secondary">
							{m["admin.vocabulary.decks.defaultBadge"]()}
						</Badge>
					) : null,
			},
			dateColumn(
				"updated",
				() => m["admin.fields.updated"](),
				(d) => d.updatedAt,
			),
		],
		fields: [
			{
				name: "name",
				label: () => m["admin.fields.name"](),
				kind: "text",
				required: true,
				full: true,
			},
			{
				name: "categoryId",
				label: () => m["admin.fields.category"](),
				kind: "select",
				options: () =>
					withNone(
						categories.map((category) => ({
							value: category.id,
							label: category.name,
						})),
					),
			},
			{
				name: "level",
				label: () => m["admin.fields.level"](),
				kind: "select",
				options: cefrOptions,
			},
			{
				name: "thumbnailUrl",
				label: () => m["admin.fields.thumbnailUrl"](),
				kind: "text",
				full: true,
			},
			{
				name: "isDefault",
				label: () => m["admin.fields.isDefault"](),
				kind: "switch",
				full: true,
			},
			{
				name: "description",
				label: () => m["admin.fields.description"](),
				kind: "textarea",
			},
		],
		blank: () => ({
			name: "",
			categoryId: NONE,
			level: "B2",
			isDefault: false,
			thumbnailUrl: "",
			description: "",
		}),
		toForm: (deck) => ({
			name: deck.name,
			categoryId: deck.categoryId ?? NONE,
			level: deck.level || "B2",
			isDefault: deck.isDefault,
			thumbnailUrl: deck.thumbnailUrl,
			description: deck.description,
		}),
		fromForm: (values, deck) => ({
			createdAt: ADMIN_TODAY,
			...deck,
			id: deck?.id ?? newAdminId("deck"),
			name: values.name.trim(),
			categoryId: fromNone(values.categoryId),
			level: values.level,
			isDefault: values.isDefault,
			thumbnailUrl: values.thumbnailUrl.trim(),
			description: values.description.trim(),
			updatedAt: ADMIN_TODAY,
		}),
		label: (deck) => deck.name,
	};
}

export function VocabularyDecksPanel() {
	const rows = useStore(adminStore, (state) => state.vocabularyDecks);
	const categories = useStore(
		adminStore,
		(state) => state.vocabularyCategories,
	);
	return (
		<ResourcePanel
			config={deckConfig(categories)}
			rows={rows}
			onSave={(row) => saveRow("vocabularyDecks", row)}
			onDelete={(row) => removeRow("vocabularyDecks", row.id)}
		/>
	);
}

/* -------------------------------------------------------- categories */

type CategoryForm = { name: string; description: string };

const CATEGORY_CONFIG: ResourceConfig<
	VocabularyCategoryResponse,
	CategoryForm
> = {
	noun: () => m["admin.vocabulary.categories.noun"](),
	columns: [
		titleColumn(
			"name",
			() => m["admin.fields.name"](),
			(category) => category.name,
			(category) => category.description,
		),
		dateColumn(
			"updated",
			() => m["admin.fields.updated"](),
			(c) => c.updatedAt,
		),
	],
	fields: [
		{
			name: "name",
			label: () => m["admin.fields.name"](),
			kind: "text",
			required: true,
			full: true,
		},
		{
			name: "description",
			label: () => m["admin.fields.description"](),
			kind: "textarea",
		},
	],
	blank: () => ({ name: "", description: "" }),
	toForm: (category) => ({
		name: category.name,
		description: category.description,
	}),
	fromForm: (values, category) => ({
		createdAt: ADMIN_TODAY,
		...category,
		id: category?.id ?? newAdminId("vcat"),
		name: values.name.trim(),
		description: values.description.trim(),
		updatedAt: ADMIN_TODAY,
	}),
	label: (category) => category.name,
};

export function VocabularyCategoriesPanel() {
	const rows = useStore(adminStore, (state) => state.vocabularyCategories);
	return (
		<ResourcePanel
			config={CATEGORY_CONFIG}
			rows={rows}
			onSave={(row) => saveRow("vocabularyCategories", row)}
			onDelete={(row) => removeRow("vocabularyCategories", row.id)}
		/>
	);
}
