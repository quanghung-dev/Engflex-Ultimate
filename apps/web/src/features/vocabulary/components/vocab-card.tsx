import type { VocabularyItem } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { Bookmark, CircleCheck, EllipsisVertical, Pencil } from "lucide-react";
import { AudioButton } from "#/components/common/audio-button";
import { CefrBadge } from "#/components/common/cefr-badge";
import { SourcePill } from "#/components/common/source-pill";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { isDue } from "#/features/vocabulary/dates";
import { TODAY } from "#/features/vocabulary/fixtures";
import { toggleMastered } from "#/features/vocabulary/store";
import { m } from "#/paraglide/messages";

export function VocabCard({ item }: { item: VocabularyItem }) {
	const state = item.userState;
	const mastered = state?.mastered ?? false;
	const due = isDue(state?.srsDueAt);
	const context = item.details?.contexts?.[0];

	return (
		<article className="flex flex-col gap-3 rounded-xl border bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				<h3 className="text-base font-bold tracking-tight text-foreground">
					{item.term}
				</h3>
				<span className="font-mono text-xs text-muted-foreground">
					{item.ipa}
				</span>
				<span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
					{item.partOfSpeech}
				</span>
				<AudioButton label={m["common.playTerm"]({ term: item.term })} />
				<CefrBadge value={item.cefr} />
				{state ? <SourcePill source={state.sourceType} /> : null}
			</div>

			{state?.sourceId ? (
				<span className="text-[11px] text-muted-foreground">
					{state.sourceType === "lesson"
						? m["vocabulary.sourceLineLesson"]({ id: state.sourceId })
						: m["vocabulary.sourceLineNote"]({ id: state.sourceId })}
				</span>
			) : null}

			<p className="text-sm text-muted-foreground">{item.definition}</p>

			{context ? (
				<div className="border-l-2 border-primary bg-secondary/40 py-2 pl-3">
					<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
						{m["vocabulary.card.contextTitle"]()}
					</span>
					<p className="mt-1 text-xs text-muted-foreground">
						“{context.quote}”
					</p>
				</div>
			) : null}

			<div className="mt-auto flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant={mastered ? "outline" : "ghost"}
					size="sm"
					onClick={() => toggleMastered(item.id)}
					className={cn(mastered && "text-accuracy")}
				>
					{mastered ? (
						<CircleCheck data-icon="inline-start" />
					) : (
						<CircleCheck
							data-icon="inline-start"
							className="text-muted-foreground"
						/>
					)}
					{mastered
						? m["vocabulary.card.fullyRetained"]()
						: m["vocabulary.card.markMastered"]()}
				</Button>

				<span className="text-[11px]">
					{mastered ? (
						<span className="font-semibold text-accuracy">
							{m["vocabulary.card.retained"]()}
						</span>
					) : due ? (
						<span className="font-semibold text-ai-coral">
							{state?.srsDueAt?.slice(0, 10) === TODAY
								? m["vocabulary.card.dueToday"]()
								: m["vocabulary.card.needsReview"]()}
						</span>
					) : (
						<span className="text-muted-foreground">
							{state?.srsDueAt?.slice(0, 10)}
						</span>
					)}
				</span>

				<div className="ml-auto flex items-center gap-1">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={m["vocabulary.card.bookmark"]()}
						onClick={() => toggleMastered(item.id)}
					>
						<Bookmark />
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={m["vocabulary.card.moreActions"]()}
							>
								<EllipsisVertical />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link to="/vocabulary/$itemId" params={{ itemId: item.id }}>
									{m["vocabulary.card.review"]()}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link to="/vocabulary/$itemId" params={{ itemId: item.id }}>
									<Pencil data-icon="inline-start" />
									{m["vocabulary.card.editNote"]()}
								</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</article>
	);
}
