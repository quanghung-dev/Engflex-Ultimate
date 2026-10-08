import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import {
	ArrowRight,
	BookmarkCheck,
	BookOpen,
	Clapperboard,
	FlaskConical,
	type LucideIcon,
	MessagesSquare,
	Users,
} from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { StatCard } from "#/components/common/stat-card";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { formatDate } from "#/features/admin/format";
import { adminStore } from "#/features/admin/store";
import { m } from "#/paraglide/messages";

const RECENT_COUNT = 5;

type SectionTo =
	| typeof APP_ROUTES.ADMIN.USERS.LIST
	| typeof APP_ROUTES.ADMIN.VOCABULARY.LIST
	| typeof APP_ROUTES.ADMIN.VIDEOS.LIST
	| typeof APP_ROUTES.ADMIN.LESSONS.LIST
	| typeof APP_ROUTES.ADMIN.SCENARIOS.LIST;

export function AdminOverview() {
	const state = useStore(adminStore);
	const activeUsers = state.users.filter((u) => u.status === "active").length;
	const admins = state.users.filter((u) => u.role === "admin").length;
	const recent = [...state.users]
		.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
		.slice(0, RECENT_COUNT);

	const sections: Array<{
		to: SectionTo;
		icon: LucideIcon;
		title: string;
		body: string;
		count: number;
	}> = [
		{
			to: APP_ROUTES.ADMIN.USERS.LIST,
			icon: Users,
			title: m["admin.nav.users"](),
			body: m["admin.overview.sections.users"](),
			count: state.users.length,
		},
		{
			to: APP_ROUTES.ADMIN.VOCABULARY.LIST,
			icon: BookmarkCheck,
			title: m["admin.nav.vocabulary"](),
			body: m["admin.overview.sections.vocabulary"](),
			count: state.vocabularyItems.length,
		},
		{
			to: APP_ROUTES.ADMIN.VIDEOS.LIST,
			icon: Clapperboard,
			title: m["admin.nav.videos"](),
			body: m["admin.overview.sections.videos"](),
			count: state.videoExercises.length,
		},
		{
			to: APP_ROUTES.ADMIN.LESSONS.LIST,
			icon: BookOpen,
			title: m["admin.nav.lessons"](),
			body: m["admin.overview.sections.lessons"](),
			count: state.lessons.length,
		},
		{
			to: APP_ROUTES.ADMIN.SCENARIOS.LIST,
			icon: MessagesSquare,
			title: m["admin.nav.scenarios"](),
			body: m["admin.overview.sections.scenarios"](),
			count: state.scenarios.length,
		},
	];

	return (
		<>
			<Alert>
				<FlaskConical />
				<AlertTitle>{m["admin.overview.mock.title"]()}</AlertTitle>
				<AlertDescription>{m["admin.overview.mock.body"]()}</AlertDescription>
			</Alert>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label={m["admin.overview.stats.users"]()}
					icon={Users}
					value={state.users.length}
					footer={m["admin.overview.stats.usersFooter"]({
						active: activeUsers,
						admins,
					})}
				/>
				<StatCard
					label={m["admin.overview.stats.vocabulary"]()}
					icon={BookmarkCheck}
					tone="accuracy"
					value={state.vocabularyItems.length}
					footer={m["admin.overview.stats.vocabularyFooter"]({
						decks: state.vocabularyDecks.length,
					})}
				/>
				<StatCard
					label={m["admin.overview.stats.videos"]()}
					icon={Clapperboard}
					tone="violet"
					value={state.videoExercises.length}
					footer={m["admin.overview.stats.videosFooter"]({
						segments: state.videoTranscripts.length,
					})}
				/>
				<StatCard
					label={m["admin.overview.stats.lessons"]()}
					icon={BookOpen}
					value={state.lessons.length}
					footer={m["admin.overview.stats.lessonsFooter"]({
						scenarios: state.scenarios.length,
					})}
				/>
			</div>
			<div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
				<section className="flex flex-col gap-3">
					<h2 className="text-lg font-bold">
						{m["admin.overview.sections.title"]()}
					</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{sections.map((section) => (
							<Link
								key={section.to}
								to={section.to}
								className="surface-card group flex items-start gap-3 p-4 transition-colors hover:border-primary"
							>
								<span className="tile bg-secondary text-primary">
									<section.icon className="size-5" />
								</span>
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<span className="flex items-center gap-2 font-bold">
										{section.title}
										<Badge variant="secondary">{section.count}</Badge>
									</span>
									<span className="text-sm text-muted-foreground">
										{section.body}
									</span>
								</div>
								<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
							</Link>
						))}
					</div>
				</section>
				<section className="flex flex-col gap-3">
					<h2 className="text-lg font-bold">
						{m["admin.overview.recent.title"]()}
					</h2>
					<ul className="surface-card divide-y divide-border p-0">
						{recent.map((user) => (
							<li
								key={user.id}
								className="flex items-center justify-between gap-3 px-4 py-3"
							>
								<div className="flex min-w-0 flex-col">
									<span className="truncate text-sm font-semibold">
										{user.name}
									</span>
									<span className="truncate text-xs text-muted-foreground">
										{user.email}
									</span>
								</div>
								<span className="shrink-0 text-xs text-muted-foreground">
									{m["admin.overview.recent.joined"]({
										date: formatDate(user.joinedAt),
									})}
								</span>
							</li>
						))}
					</ul>
				</section>
			</div>
		</>
	);
}
