import type { Category, CEFR, Lesson } from "@engflex/contracts";
import { useStore } from "@tanstack/react-store";
import {
	cefrColumn,
	cefrOptions,
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
import { slugify } from "#/features/admin/format";
import {
	adminStore,
	newAdminId,
	removeRow,
	saveRow,
} from "#/features/admin/store";
import { m } from "#/paraglide/messages";

/* ----------------------------------------------------------- lessons */

type LessonForm = {
	title: string;
	slug: string;
	categoryId: string;
	cefrLevel: string;
	partCount: number;
	estimatedDurationMin: number;
	description: string;
};

function lessonConfig(
	categories: Category[],
): ResourceConfig<Lesson, LessonForm> {
	return {
		noun: () => m["admin.lessons.lessons.noun"](),
		columns: [
			titleColumn(
				"title",
				() => m["admin.fields.title"](),
				(lesson) => lesson.title,
				(lesson) => lesson.slug,
			),
			textColumn(
				"category",
				() => m["admin.fields.category"](),
				(lesson) => lesson.category?.name,
			),
			cefrColumn((lesson) => lesson.cefrLevel),
			textColumn(
				"parts",
				() => m["admin.fields.parts"](),
				(l) => l.partCount,
			),
			textColumn(
				"duration",
				() => m["admin.fields.durationMinutes"](),
				(lesson) => lesson.details.estimatedDurationMin,
			),
		],
		fields: [
			{
				name: "title",
				label: () => m["admin.fields.title"](),
				kind: "text",
				required: true,
				full: true,
			},
			{ name: "slug", label: () => m["admin.fields.slug"](), kind: "text" },
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
				name: "cefrLevel",
				label: () => m["admin.fields.cefr"](),
				kind: "select",
				options: cefrOptions,
			},
			{
				name: "partCount",
				label: () => m["admin.fields.parts"](),
				kind: "number",
			},
			{
				name: "estimatedDurationMin",
				label: () => m["admin.fields.durationMinutes"](),
				kind: "number",
				full: true,
			},
			{
				name: "description",
				label: () => m["admin.fields.description"](),
				kind: "textarea",
			},
		],
		blank: () => ({
			title: "",
			slug: "",
			categoryId: NONE,
			cefrLevel: "B2",
			partCount: 4,
			estimatedDurationMin: 20,
			description: "",
		}),
		toForm: (lesson) => ({
			title: lesson.title,
			slug: lesson.slug,
			categoryId: lesson.category?.id ?? NONE,
			cefrLevel: lesson.cefrLevel,
			partCount: lesson.partCount,
			estimatedDurationMin: lesson.details.estimatedDurationMin ?? 0,
			description: lesson.description,
		}),
		fromForm: (values, lesson) => {
			const categoryId = fromNone(values.categoryId);
			return {
				...lesson,
				id: lesson?.id ?? newAdminId("lesson"),
				slug: slugify(values.slug || values.title),
				title: values.title.trim(),
				// The wire shape nests the category, so resolve the picked id.
				category: categories.find((category) => category.id === categoryId),
				cefrLevel: values.cefrLevel as CEFR,
				partCount: Math.round(values.partCount),
				description: values.description.trim(),
				details: {
					coverImageUrl: "",
					...lesson?.details,
					estimatedDurationMin: Math.round(values.estimatedDurationMin),
				},
			};
		},
		label: (lesson) => lesson.title,
	};
}

export function LessonsPanel() {
	const rows = useStore(adminStore, (state) => state.lessons);
	const categories = useStore(adminStore, (state) => state.lessonCategories);
	return (
		<ResourcePanel
			config={lessonConfig(categories)}
			rows={rows}
			onSave={(row) => saveRow("lessons", row)}
			onDelete={(row) => removeRow("lessons", row.id)}
		/>
	);
}

/* -------------------------------------------------------- categories */

type CategoryForm = { name: string; slug: string };

const CATEGORY_CONFIG: ResourceConfig<Category, CategoryForm> = {
	noun: () => m["admin.lessons.categories.noun"](),
	columns: [
		titleColumn(
			"name",
			() => m["admin.fields.name"](),
			(category) => category.name,
		),
		textColumn(
			"slug",
			() => m["admin.fields.slug"](),
			(c) => c.slug,
		),
	],
	fields: [
		{
			name: "name",
			label: () => m["admin.fields.name"](),
			kind: "text",
			required: true,
		},
		{ name: "slug", label: () => m["admin.fields.slug"](), kind: "text" },
	],
	blank: () => ({ name: "", slug: "" }),
	toForm: (category) => ({ name: category.name, slug: category.slug }),
	fromForm: (values, category) => ({
		id: category?.id ?? newAdminId("cat"),
		name: values.name.trim(),
		slug: slugify(values.slug || values.name),
	}),
	label: (category) => category.name,
};

export function LessonCategoriesPanel() {
	const rows = useStore(adminStore, (state) => state.lessonCategories);
	return (
		<ResourcePanel
			config={CATEGORY_CONFIG}
			rows={rows}
			onSave={(row) => saveRow("lessonCategories", row)}
			onDelete={(row) => removeRow("lessonCategories", row.id)}
		/>
	);
}
