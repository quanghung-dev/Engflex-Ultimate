import type { CSSProperties, ReactNode } from "react";
import { AppSidebar } from "#/components/layout/app-sidebar";
import { Topbar } from "#/components/layout/topbar";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
	return (
		<SidebarProvider style={{ "--sidebar-width": "15rem" } as CSSProperties}>
			<AppSidebar />
			<SidebarInset className="grid-bg">
				<Topbar />
				<div className="flex flex-1 flex-col">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
