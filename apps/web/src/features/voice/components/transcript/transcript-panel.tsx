import type {
	ConversationMessage,
	ConversationMessagePart,
} from "@pipecat-ai/client-react";
import { usePipecatConversation } from "@pipecat-ai/client-react";
import { PencilLine } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { CorrectionModal } from "#/features/voice/components/transcript/correction-modal";
import { TurnFeedbackPanel } from "#/features/voice/components/transcript/turn-feedback";
import { useCorrectionModal } from "#/features/voice/hooks/use-correction-modal";
import { useAnalyzeTurn, useConversation } from "#/features/voice/queries";
import { cn } from "#/lib/utils";
import { m } from "#/paraglide/messages";

/** Plain-text extraction for a pipecat message part. */
function getPartText(part: ConversationMessagePart): string {
	const text = part.text;
	if (typeof text === "string") return text;
	if (
		text !== null &&
		typeof text === "object" &&
		"spoken" in text &&
		"unspoken" in text
	) {
		const value = text as { spoken: string; unspoken: string };
		return [value.spoken, value.unspoken].filter(Boolean).join(" ");
	}
	return "";
}

function getMessageText(message: ConversationMessage): string {
	return (
		message.parts
			?.map(getPartText)
			.filter(Boolean)
			.join(" ")
			.replace(/\s+/g, " ")
			.trim() ?? ""
	);
}

export type TranscriptRow = {
	key: string;
	isUser: boolean;
	text: string;
	accessory?: ReactNode;
};

/** One bubble: consecutive same-role messages already collapsed together. */
type Group = { key: string; isUser: boolean; text: string };

/** One accepted correction, as the panel needs it to redraw honestly. */
type AppliedCorrection = {
	/** What the learner said it should say. */ text: string;
	/** How many bubbles existed when they sent it. Anything at or past this
	 * index arrived afterwards — the regenerated reply — and must survive. */
	boundary: number;
};

/**
 * The corrected transcript, derived from pipecat's own message list.
 *
 * The engine owns the correction: it rewrote its context and the persisted
 * turns, and its regenerated reply overwrites the stale one at the same
 * position. Pipecat's client-side list knows none of that, so writing to it
 * would mean inventing a second history that disagrees with the server.
 * Instead the panel redraws: the reviewed turn takes the corrected text, and
 * everything that answered the old words is dropped.
 *
 * The boundary is what keeps this from eating the reply the correction asks
 * for. Without it the transform would be reapplied on every render and the
 * regenerated answer would be discarded too.
 */
function applyCorrection(
	groups: Group[],
	applied: AppliedCorrection | null,
): Group[] {
	if (!applied) return groups;
	let target = -1;
	for (let i = groups.length - 1; i >= 0; i--) {
		if (groups[i].isUser) {
			target = i;
			break;
		}
	}
	// The learner has spoken again since correcting, so the newest turn is not
	// the one they fixed. Their correction has been overtaken; leave it be.
	if (target < 0 || target >= applied.boundary) return groups;
	return [
		...groups.slice(0, target),
		{ ...groups[target], text: applied.text },
		...groups.slice(applied.boundary),
	];
}

/** Shared bubble list: the live panel and the persisted review render rows
identically; only the accessory below a bubble differs. */
export function TranscriptRows({ rows }: { rows: TranscriptRow[] }) {
	return (
		<ul className="flex flex-col gap-4">
			{rows.map((row) => (
				<li
					key={row.key}
					className={cn(
						"flex min-w-0 gap-2",
						row.isUser ? "flex-row-reverse" : "flex-row",
					)}
				>
					<Avatar size="sm">
						<AvatarFallback>
							{row.isUser
								? m["voice.room.speakerYou"]().slice(0, 1)
								: m["voice.room.partnerFallback"]().slice(0, 1)}
						</AvatarFallback>
					</Avatar>
					<div
						className={cn(
							"flex min-w-0 max-w-[85%] flex-col gap-1",
							row.isUser ? "items-end" : "items-start",
						)}
					>
						<span className="text-[11px] font-medium text-muted-foreground">
							{row.isUser
								? m["voice.room.speakerYou"]()
								: m["voice.room.partnerFallback"]()}
						</span>
						<p
							className={cn(
								"rounded-xl px-3 py-2 text-sm break-words",
								row.isUser
									? "bg-primary text-primary-foreground"
									: "bg-muted text-foreground",
							)}
						>
							{row.text}
						</p>
						{row.accessory}
					</div>
				</li>
			))}
		</ul>
	);
}

/**
 * The transcript: avatar + bubble rows inside a Card + ScrollArea, one of the
 * two panels in the room.
 *
 * `messages` overrides the live conversation: the dev-only preview route
 * passes fixture turns so the layout can be tweaked without a real session.
 */
export function TranscriptPanel({
	className,
	messages: messagesOverride,
	conversationId,
}: {
	className?: string;
	messages?: ConversationMessage[];
	conversationId?: string;
}) {
	const live = usePipecatConversation();
	const messages = messagesOverride ?? live.messages;
	const bottomRef = useRef<HTMLDivElement>(null);

	// Live persisted turns, polled while a session is running. Positions are
	// assigned by finalize order on both sides, so group ordinal == position.
	const persisted = useConversation(conversationId ?? "", {
		refetchInterval: conversationId ? 2000 : undefined,
	});
	const analyze = useAnalyzeTurn(conversationId ?? "");
	// The last correction the engine accepted, plus how many bubbles existed
	// when it landed. Recorded here because the panel owns what is displayed.
	const [applied, setApplied] = useState<AppliedCorrection | null>(null);
	const correction = useCorrectionModal(conversationId ?? null, {
		onCorrected: (text) =>
			setApplied({ text, boundary: groupCountRef.current }),
	});
	const persistedByPosition = new Map(
		(persisted.data?.turns ?? []).map((turn) => [turn.position, turn]),
	);

	const rows = messages
		.map((message, index) => ({
			message,
			index,
			text: getMessageText(message),
		}))
		.filter(
			(row) =>
				(row.message.role === "user" || row.message.role === "assistant") &&
				row.text.length > 0,
		);

	// Collapse consecutive same-role messages exactly like the engine
	// collector does, so group ordinal aligns with persisted positions.
	const groups: Group[] = [];
	let prevRole: string | null = null;
	for (const row of rows) {
		const isUser = row.message.role === "user";
		const last = groups[groups.length - 1];
		if (last && prevRole === row.message.role) {
			last.text = `${last.text} ${row.text}`.trim();
		} else {
			groups.push({
				key: `${row.message.createdAt}-${row.index}`,
				isUser,
				text: row.text,
			});
		}
		prevRole = row.message.role;
	}

	// The correction is a derivation over pipecat's own list; nothing is written
	// back to it. See applyCorrection for why the boundary matters.
	const shown = applyCorrection(groups, applied);

	// Scroll on what is displayed, not on what pipecat holds, so dropping a
	// stale reply does not leave the view parked past the end.
	const rowCount = shown.length;
	useEffect(() => {
		if (rowCount === 0) return;
		bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [rowCount]);

	// The boundary is captured when the learner sends, so it must read the
	// bubbles as they were at that moment — not as they are after the
	// correction has already been applied.
	const groupCountRef = useRef(shown.length);
	useEffect(() => {
		groupCountRef.current = shown.length;
	}, [shown.length]);

	// The learner reviews their most recent turn. Nothing decides for them
	// that a turn was misheard, so this is available whenever there is
	// something to review; the engine resolves the target itself.
	const canReview = Boolean(conversationId && shown.some((g) => g.isUser));
	const lastUserIndex = (() => {
		for (let i = shown.length - 1; i >= 0; i--) {
			if (shown[i].isUser) return i;
		}
		return -1;
	})();

	return (
		<>
			{correction.window && (
				<CorrectionModal
					window={correction.window}
					onSubmit={correction.send}
					onEdit={correction.edit}
					onSpeakAgain={correction.speakAgain}
					onDismiss={correction.dismiss}
				/>
			)}
			<Card className={cn("flex h-full min-h-0 flex-col", className)}>
				<CardHeader className="pb-0">
					<CardTitle className="flex items-center gap-2 text-base">
						{m["voice.room.transcriptTitle"]()}
						<Badge variant="secondary">{shown.length}</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="min-h-0 flex-1 pb-6">
					<ScrollArea className="h-full max-h-[55vh] min-h-0 overflow-x-clip pr-3 lg:max-h-none">
						{shown.length === 0 ? (
							<p className="py-8 text-center text-sm text-muted-foreground">
								{m["voice.room.transcriptEmpty"]()}
							</p>
						) : (
							<TranscriptRows
								rows={shown.map((group, groupIndex) => {
									// Global position: group ordinal, aligned with the
									// persisted turns. The Analyze button appears only
									// once the row exists server-side, so a transient
									// mismatch can delay it but never misattach feedback.
									const position = groupIndex + 1;
									const persistedTurn = persistedByPosition.get(position);
									const showAnalyze =
										group.isUser && persistedTurn !== undefined;
									// Review belongs to the turn being corrected, so it
									// sits under that bubble rather than in the header
									// where it read as a panel-level action.
									const showReview = canReview && groupIndex === lastUserIndex;
									return {
										key: group.key,
										isUser: group.isUser,
										text: group.text,
										accessory:
											showReview || showAnalyze ? (
												<div className="flex flex-wrap items-start gap-1.5">
													{showReview && (
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	type="button"
																	variant="outline"
																	size="icon-sm"
																	aria-label={m[
																		"voice.room.recovery.reviewTranscript"
																	]()}
																	onClick={() => void correction.open()}
																>
																	<PencilLine />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																{m["voice.room.recovery.reviewTranscript"]()}
															</TooltipContent>
														</Tooltip>
													)}
													{showAnalyze && (
														<TurnFeedbackPanel
															feedback={persistedTurn.feedback ?? undefined}
															pending={analyze.isPending}
															failed={analyze.isError}
															onAnalyze={() => analyze.mutate(position)}
														/>
													)}
												</div>
											) : undefined,
									};
								})}
							/>
						)}
						<div ref={bottomRef} />
					</ScrollArea>
				</CardContent>
			</Card>
		</>
	);
}
