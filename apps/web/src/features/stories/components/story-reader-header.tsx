import type { StoryDetail } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import {
	ArrowLeft,
	Bookmark,
	BookOpen,
	Headphones,
	Languages,
	Settings,
} from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { CefrBadge } from "#/components/common/cefr-badge";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export interface StoryReaderHeaderItem extends StoryDetail {
	bookmarks?: number;
	saved?: boolean;
}

export function StoryReaderHeader({
	story,
	mode,
	onModeChange,
	showTranslation,
	onToggleTranslation,
	saved,
	bookmarkCount,
	onToggleSave,
}: {
	story: StoryReaderHeaderItem;
	mode: "listen" | "read";
	onModeChange: (m: "listen" | "read") => void;
	showTranslation: boolean;
	onToggleTranslation: () => void;
	saved: boolean;
	bookmarkCount: number;
	onToggleSave: () => void;
}) {
	return (
		<header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-4 py-3">
			{/* Left: Back + Title & Badge */}
			<div className="flex items-center gap-3">
				<Link
					to={APP_ROUTES.STORIES.LIST}
					className="flex size-9 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-muted"
					aria-label="Back"
				>
					<ArrowLeft className="size-4" />
				</Link>

				<div className="flex flex-col">
					<div className="flex items-center gap-2">
						<h1 className="font-extrabold text-foreground text-lg tracking-tight">
							{story.title}
						</h1>
						{story.cefrLevel ? <CefrBadge value={story.cefrLevel} /> : null}
					</div>
					{story.titleVietnamese ? (
						<p className="text-muted-foreground text-xs font-medium">
							{story.titleVietnamese}
						</p>
					) : null}
				</div>
			</div>

			{/* Right: Controls & Actions */}
			<div className="flex flex-wrap items-center gap-2">
				{/* Mode toggle */}
				<div className="flex items-center rounded-xl border border-border bg-muted/50 p-1">
					<button
						type="button"
						onClick={() => onModeChange("listen")}
						className={cn(
							"flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold text-xs transition-colors",
							mode === "listen"
								? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Headphones className="size-3.5" />
						<span>{m["stories.reader.listenAndRead"]()}</span>
					</button>

					<button
						type="button"
						onClick={() => onModeChange("read")}
						className={cn(
							"flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold text-xs transition-colors",
							mode === "read"
								? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<BookOpen className="size-3.5" />
						<span>{m["stories.reader.readOnly"]()}</span>
					</button>
				</div>

				{/* Translation toggle button */}
				<Button
					variant="outline"
					size="sm"
					onClick={onToggleTranslation}
					className={cn(
						"gap-1.5 rounded-xl border-border font-bold text-xs",
						showTranslation
							? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Languages className="size-3.5" />
					<span>
						{showTranslation
							? m["stories.reader.hideTranslation"]()
							: m["stories.reader.showTranslation"]()}
					</span>
				</Button>

				{/* Settings button */}
				<Button
					variant="outline"
					size="icon"
					className="size-9 rounded-xl border-border text-muted-foreground hover:text-foreground"
					aria-label="Settings"
				>
					<Settings className="size-4" />
				</Button>

				{/* Save / Bookmark toggle button */}
				<Button
					variant="outline"
					size="sm"
					onClick={onToggleSave}
					className={cn(
						"gap-1.5 rounded-xl border-border font-bold text-xs transition-colors",
						saved
							? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Bookmark
						className={cn("size-3.5", saved ? "fill-primary text-primary" : "")}
					/>
					<span>
						{saved ? m["stories.reader.saved"]() : m["stories.reader.save"]()}
					</span>
					<span className="font-semibold">{bookmarkCount}</span>
				</Button>
			</div>
		</header>
	);
}
