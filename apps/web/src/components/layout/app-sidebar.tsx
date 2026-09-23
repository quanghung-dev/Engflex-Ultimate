import { UserButton, useUser } from "@clerk/tanstack-react-start";
import { Link, useRouterState } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { AudioWaveform, BookmarkCheck, BookOpen, House } from "lucide-react";
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
import { profileStore } from "#/features/profiles/store";
import { m } from "#/paraglide/messages";

const NAV_GROUPS = [
	{
		label: () => m["nav.groupPractice"](),
		items: [
			{ title: () => m["nav.home"](), to: APP_ROUTES.HOME, icon: House },
			{
				title: () => m["nav.lessons"](),
				to: APP_ROUTES.LESSONS,
				icon: BookOpen,
			},
			{
				title: () => m["nav.voice"](),
				to: APP_ROUTES.VOICE,
				icon: AudioWaveform,
			},
		],
	},
	{
		label: () => m["nav.groupKnowledge"](),
		items: [
			{
				title: () => m["nav.vocabulary"](),
				to: APP_ROUTES.VOCABULARY,
				icon: BookmarkCheck,
			},
		],
	},
] as const;

const LEVEL_LABELS = {
	beginner: () => m["nav.level.beginner"](),
	intermediate: () => m["nav.level.intermediate"](),
	advanced: () => m["nav.level.advanced"](),
} as const;

export function AppSidebar() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							asChild
							className="hover:bg-transparent"
						>
							<Link to={APP_ROUTES.HOME}>
								<Logo variant="full" />
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{NAV_GROUPS.map((group) => (
					<SidebarGroup key={group.label()}>
						<SidebarGroupLabel>{group.label()}</SidebarGroupLabel>
						<SidebarMenu>
							{group.items.map((item) => {
								const isActive =
									item.to === APP_ROUTES.HOME
										? pathname === APP_ROUTES.HOME
										: pathname.startsWith(item.to);
								return (
									<SidebarMenuItem key={item.title()}>
										<SidebarMenuButton asChild isActive={isActive}>
											<Link to={item.to} className="font-medium">
												<item.icon />
												<span className="text-foreground">{item.title()}</span>
												{isActive ? (
													<span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />
												) : null}
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
				<SidebarUserCard />
			</SidebarFooter>
		</Sidebar>
	);
}

function SidebarUserCard() {
	const { user } = useUser();
	const level = useStore(
		profileStore,
		(state) => state.profile.preferences.level,
	);

	const name = user?.fullName ?? user?.firstName ?? m["nav.learner"]();

	return (
		<div className="flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-card p-2">
			<Avatar className="size-7">
				<UserButton />
			</Avatar>
			<div className="flex min-w-0 flex-col leading-tight">
				<span className="truncate text-[13px] font-semibold">{name}</span>
				<span className="text-[11px] text-muted-foreground">
					{m["nav.learner"]()}
				</span>
			</div>
			<Badge variant="secondary" className="ml-auto">
				{LEVEL_LABELS[level]()}
			</Badge>
		</div>
	);
}
