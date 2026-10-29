import type { StoryItem } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { Bookmark, Clock3, Eye, Headphones } from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { CefrBadge } from "#/components/common/cefr-badge";
import { m } from "#/paraglide/messages";

export interface StoryCardItem extends StoryItem {
	views?: number;
	bookmarks?: number;
	saved?: boolean;
}

export function StoryCard({ story }: { story: StoryCardItem }) {
	const minutes = Math.max(1, Math.round(story.duration / 60));
	const hasAudio = Boolean(story.audioUrl);

	return (
		<Link
			to={APP_ROUTES.STORIES.DETAIL}
			params={{ slug: story.slug }}
			className={cn(
				"group flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card p-2 text-left transition-all",
				"hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
			)}
		>
			{/* Book Cover Container */}
			<div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-border/80 bg-muted">
				{story.thumbnailUrl ? (
					<img
						src={story.thumbnailUrl}
						alt={story.title}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
						{story.title}
					</div>
				)}

				{/* Vintage vignette / border overlay */}
				<div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10" />

				{/* Level Badge on top-left */}
				{story.cefrLevel ? (
					<div className="absolute top-2 left-2">
						<CefrBadge value={story.cefrLevel} className="shadow-xs" />
					</div>
				) : null}

				{/* Has Audio indicator on bottom-right */}
				{hasAudio ? (
					<div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
						<Headphones className="size-3" />
						<span>{m["stories.card.hasAudio"]()}</span>
					</div>
				) : null}
			</div>

			{/* Info section */}
			<div className="flex flex-1 flex-col pt-2.5 pb-1">
				<h3 className="line-clamp-1 font-bold text-foreground text-sm tracking-tight group-hover:text-primary">
					{story.title}
				</h3>
				{story.titleVietnamese ? (
					<p className="line-clamp-1 text-muted-foreground text-xs">
						{story.titleVietnamese}
					</p>
				) : null}
				<p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground/80 font-medium">
					{story.topic}
				</p>

				{/* Bottom meta stats */}
				<div className="mt-auto flex items-center justify-between pt-2.5 text-[11px] text-muted-foreground">
					<span className="flex items-center gap-1">
						<Clock3 className="size-3 text-muted-foreground/70" />
						<span>{m["stories.card.minutes"]({ count: minutes })}</span>
					</span>
					{story.views != null ? (
						<span className="flex items-center gap-1">
							<Eye className="size-3 text-muted-foreground/70" />
							<span>{story.views.toLocaleString()}</span>
						</span>
					) : null}
					{story.bookmarks != null ? (
						<span className="flex items-center gap-1">
							<Bookmark
								className={cn(
									"size-3",
									story.saved
										? "fill-primary text-primary"
										: "text-muted-foreground/70",
								)}
							/>
							<span>{story.bookmarks}</span>
						</span>
					) : null}
				</div>
			</div>
		</Link>
	);
}
