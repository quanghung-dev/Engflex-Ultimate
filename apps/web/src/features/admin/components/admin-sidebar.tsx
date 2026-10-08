import { UserButton, useUser } from "@clerk/tanstack-react-start";
import { Link, useRouterState } from "@tanstack/react-router";
import {
	ArrowLeft,
	BookmarkCheck,
	BookOpen,
	Clapperboard,
	LayoutDashboard,
	MessagesSquare,
	Users,
} from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { Logo } from "#/components/common/logo";
import { Avatar } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "#/components/ui/sidebar";
import { m } from "#/paraglide/messages";

const NAV_GROUPS = [
	{
		label: () => m["admin.nav.group.people"](),
		items: [
			{
				title: () => m["admin.nav.overview"](),
				to: APP_ROUTES.ADMIN.OVERVIEW,
				icon: LayoutDashboard,
			},
			{
				title: () => m["admin.nav.users"](),
				to: APP_ROUTES.ADMIN.USERS.LIST,
				icon: Users,
			},
		],
	},
	{
		label: () => m["admin.nav.group.content"](),
		items: [
			{
				title: () => m["admin.nav.vocabulary"](),
				to: APP_ROUTES.ADMIN.VOCABULARY.LIST,
				icon: BookmarkCheck,
			},
			{
				title: () => m["admin.nav.videos"](),
				to: APP_ROUTES.ADMIN.VIDEOS.LIST,
				icon: Clapperboard,
			},
			{
				title: () => m["admin.nav.lessons"](),
				to: APP_ROUTES.ADMIN.LESSONS.LIST,
				icon: BookOpen,
			},
			{
				title: () => m["admin.nav.scenarios"](),
				to: APP_ROUTES.ADMIN.SCENARIOS.LIST,
				icon: MessagesSquare,
			},
		],
	},
] as const;

export function AdminSidebar() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { user } = useUser();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="group-data-[collapsible=icon]:px-0">
				<Link
					to={APP_ROUTES.ADMIN.OVERVIEW}
					className="flex h-12 items-center gap-2 rounded-md px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
				>
					<Logo
						variant="full"
						className="text-sidebar-foreground group-data-[collapsible=icon]:[&>span:last-child]:hidden"
					/>
					<Badge
						variant="secondary"
						className="chip chip-accent px-2 py-0.5 text-[11px] group-data-[collapsible=icon]:hidden"
					>
						{m["admin.shell.badge"]()}
					</Badge>
				</Link>
			</SidebarHeader>
			<SidebarContent className="group-data-[collapsible=icon]:gap-1">
				{NAV_GROUPS.map((group) => (
					<SidebarGroup
						key={group.label()}
						className="group-data-[collapsible=icon]:p-0"
					>
						<SidebarGroupLabel>{group.label()}</SidebarGroupLabel>
						<SidebarMenu>
							{group.items.map((item) => {
								// The overview is a prefix of every admin path, so it
								// only matches exactly.
								const isActive =
									item.to === APP_ROUTES.ADMIN.OVERVIEW
										? pathname === item.to
										: pathname.startsWith(item.to);
								return (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											tooltip={item.title()}
										>
											<Link to={item.to} className="font-medium">
												<item.icon />
												<span>{item.title()}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild tooltip={m["admin.shell.backToApp"]()}>
							<Link to={APP_ROUTES.HOME} className="font-medium">
								<ArrowLeft />
								<span>{m["admin.shell.backToApp"]()}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				<div className="flex items-center gap-2.5 rounded-[16px] border-2 border-sidebar-border bg-card p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
					<Avatar className="size-7 shrink-0">
						<UserButton />
					</Avatar>
					<div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
						<span className="truncate text-[13px] font-bold text-card-foreground">
							{user?.fullName ?? user?.firstName ?? m["admin.shell.badge"]()}
						</span>
						<span className="truncate text-[11px] font-medium text-muted-foreground">
							{m["admin.shell.signedInAs"]()}
						</span>
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
