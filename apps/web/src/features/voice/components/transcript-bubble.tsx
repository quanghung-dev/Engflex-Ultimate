import type { Turn } from "@engflex/contracts";
import { cn } from "cn";

import { m } from "#/paraglide/messages";

export function TranscriptBubble({
	turn,
	speakerName,
	streamingText,
}: {
	turn: Turn | undefined;
	speakerName: string;
	streamingText?: string;
}) {
	const role = turn?.role ?? "user";
	const isUser = role === "user";

	return (
		<div
			className={cn(
				"flex flex-col gap-1",
				isUser ? "items-end" : "items-start",
			)}
		>
			<span className="flex items-center gap-2 text-[11px] text-muted-foreground">
				<span
					className={cn(
						"rounded-full px-2 py-0.5 font-semibold",
						isUser ? "bg-secondary text-primary" : "bg-muted text-foreground",
					)}
				>
					{speakerName}
				</span>
				{turn ? turn.createdAt.slice(11, 16) : m["voice.room.now"]()}
			</span>
			<p
				className={cn(
					"max-w-[85%] rounded-xl px-3 py-2 text-sm",
					isUser
						? "rounded-tr-sm bg-primary/5 text-foreground"
						: "rounded-tl-sm bg-muted text-foreground",
				)}
			>
				{turn ? turn.text : streamingText}
				{!turn ? (
					<span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
				) : null}
			</p>
		</div>
	);
}
