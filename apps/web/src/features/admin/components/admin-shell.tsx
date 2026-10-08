import type { CSSProperties, ReactNode } from "react";
import { Topbar } from "#/components/layout/topbar";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";
import { AdminSidebar } from "#/features/admin/components/admin-sidebar";

/** `AppShell`'s frame with the back-office nav; the topbar is shared as-is. */
export function AdminShell({ children }: { children: ReactNode }) {
	return (
		<SidebarProvider style={{ "--sidebar-width": "15rem" } as CSSProperties}>
			<AdminSidebar />
			<SidebarInset className="app-canvas">
				<Topbar />
				<div className="flex flex-1 flex-col">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
