import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { CircleCheck, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { SequenceCard as SequenceCardFixture } from "#/features/attempts/fixtures";
import { m } from "#/paraglide/messages";

const DOT_TONE: Record<SequenceCardFixture["state"], string> = {
	done: "bg-accuracy",
	"up-next": "bg-primary",
	queued: "bg-muted-foreground/40",
	due: "bg-ai-coral",
};

/** Chrome copy for each sequence row, keyed by the fixture card id. */
const CARD_COPY: Record<
	string,
	{
		kicker: () => string;
		title: () => string;
		description: () => string;
		cta: () => string;
	}
> = {
	shadowing: {
		kicker: () => m["dashboard.sequence.cards.shadowing.kicker"](),
		title: () => m["dashboard.sequence.cards.shadowing.title"](),
		description: () => m["dashboard.sequence.cards.shadowing.description"](),
		cta: () => m["dashboard.sequence.cards.shadowing.cta"](),
	},
	dictation: {
		kicker: () => m["dashboard.sequence.cards.dictation.kicker"](),
		title: () => m["dashboard.sequence.cards.dictation.title"](),
		description: () => m["dashboard.sequence.cards.dictation.description"](),
		cta: () => m["dashboard.sequence.cards.dictation.cta"](),
	},
	roleplay: {
		kicker: () => m["dashboard.sequence.cards.roleplay.kicker"](),
		title: () => m["dashboard.sequence.cards.roleplay.title"](),
		description: () => m["dashboard.sequence.cards.roleplay.description"](),
		cta: () => m["dashboard.sequence.cards.roleplay.cta"](),
	},
	spaced: {
		kicker: () => m["dashboard.sequence.cards.spaced.kicker"](),
		title: () => m["dashboard.sequence.cards.spaced.title"](),
		description: () => m["dashboard.sequence.cards.spaced.description"](),
		cta: () => m["dashboard.sequence.cards.spaced.cta"](),
	},
};

export function SequenceCard({ card }: { card: SequenceCardFixture }) {
	const isAccent = card.state === "up-next";
	const copy = CARD_COPY[card.id];
	const body = (
		<div className="flex h-full flex-col gap-3 p-4">
			<div className="flex items-center gap-2">
				<span className={cn("size-1.5 rounded-full", DOT_TONE[card.state])} />
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{copy?.kicker()}
				</span>
				<span className="ml-auto text-[11px] text-muted-foreground">
					{m["dashboard.sequence.duration"]({ count: card.durationMin })}
				</span>
			</div>
			<div>
				<h3 className="text-sm font-bold tracking-tight text-foreground">
					{copy?.title()}
				</h3>
				<p className="mt-1 text-xs text-muted-foreground">
					{copy?.description()}
				</p>
			</div>
			<div className="mt-auto flex items-center justify-between gap-2">
				<span className="flex items-center gap-1 text-xs">
					{card.state === "done" ? (
						<>
							<CircleCheck className="size-3.5 text-accuracy" />
							<span className="text-accuracy">
								{m["dashboard.sequence.doneScore"]({
									score: card.scorePct ?? 0,
								})}
							</span>
						</>
					) : null}
					{card.state === "up-next" ? (
						<span className="font-semibold text-primary">
							{m["dashboard.sequence.state.upNext"]()}
						</span>
					) : null}
					{card.state === "queued" ? (
						<>
							<Clock3 className="size-3.5 text-muted-foreground" />
							<span className="text-muted-foreground">
								{m["dashboard.sequence.state.queued"]()}
							</span>
						</>
					) : null}
					{card.state === "due" ? (
						<Badge variant="secondary" className="text-ai-coral">
							{m["dashboard.sequence.dueCount"]({
								count: card.dueCount ?? 0,
							})}
						</Badge>
					) : null}
				</span>
				{card.target ? (
					card.target.kind === "lesson" ? (
						<Button asChild variant="ghost" size="sm">
							<Link
								to="/lessons/$lessonId"
								params={{ lessonId: card.target.lessonId }}
							>
								{copy?.cta()}
							</Link>
						</Button>
					) : (
						<Button asChild variant="ghost" size="sm">
							<Link to={card.target.to}>{copy?.cta()}</Link>
						</Button>
					)
				) : (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => toast(m["common.replayMockOnly"]())}
					>
						{copy?.cta()}
					</Button>
				)}
			</div>
		</div>
	);

	if (isAccent) {
		return (
			<div className="energy-card h-full">
				<div className="energy-card-inner h-full">{body}</div>
			</div>
		);
	}

	return (
		<div className="h-full rounded-xl border bg-card transition hover:border-primary/40">
			{body}
		</div>
	);
}
