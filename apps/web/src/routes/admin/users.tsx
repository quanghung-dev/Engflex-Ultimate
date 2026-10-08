import { createFileRoute } from "@tanstack/react-router";
import { breadcrumb } from "#/app/breadcrumbs";
import { AdminPage } from "#/features/admin/components/admin-page";
import { UsersPanel } from "#/features/admin/components/users-panel";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/admin/users")({
	staticData: breadcrumb(() => m["admin.nav.users"]()),
	component: AdminUsersPage,
});

function AdminUsersPage() {
	return (
		<AdminPage
			title={m["admin.users.title"]()}
			subtitle={m["admin.users.subtitle"]()}
		>
			<UsersPanel />
		</AdminPage>
	);
}
