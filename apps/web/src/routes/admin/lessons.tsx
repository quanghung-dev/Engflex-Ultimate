import { createFileRoute } from "@tanstack/react-router";
import { breadcrumb } from "#/app/breadcrumbs";
import { AdminPage } from "#/features/admin/components/admin-page";
import {
	LessonCategoriesPanel,
	LessonsPanel,
} from "#/features/admin/components/lesson-panels";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/admin/lessons")({
	staticData: breadcrumb(() => m["admin.nav.lessons"]()),
	component: AdminLessonsPage,
});

function AdminLessonsPage() {
	return (
		<AdminPage
			title={m["admin.lessons.title"]()}
			subtitle={m["admin.lessons.subtitle"]()}
			tabs={[
				{
					value: "lessons",
					label: m["admin.lessons.tabs.lessons"](),
					content: <LessonsPanel />,
				},
				{
					value: "categories",
					label: m["admin.lessons.tabs.categories"](),
					content: <LessonCategoriesPanel />,
				},
			]}
		/>
	);
}
