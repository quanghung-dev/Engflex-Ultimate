import { MessageSquareText } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "#/components/ui/sheet";
import { m } from "#/paraglide/messages";

/**
 * The room layout: two panels side by side on desktop, the transcript
 * behind a bottom sheet on mobile. Pure layout — the page injects what
 * goes in each slot, so the real room injects live panels and the DEV
 * preview injects fixture views into the same shells.
 *
 * `transcript` renders twice (desktop cell + mobile sheet) from one
 * element: two instances, same as the room always did. It must be
 * layout-neutral (no `hidden lg:flex` of its own) — the desktop wrapper
 * below owns visibility. Give it `w-full` so it fills the desktop cell.
 */
export function VoiceRoomLayout({
	voice,
	transcript,
	objective,
}: {
	voice: ReactNode;
	transcript: ReactNode;
	objective: string;
}) {
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
			<div className="grid min-h-0 flex-1 items-stretch gap-4 lg:h-[calc(100dvh-5.5rem)] lg:flex-none lg:grid-cols-2">
				{voice}
				<div className="hidden min-h-0 min-w-0 lg:flex">{transcript}</div>
			</div>
			<div className="lg:hidden">
				<Sheet>
					<SheetTrigger asChild>
						<Button type="button" variant="outline">
							<MessageSquareText data-icon="inline-start" />
							{m["voice.room.transcriptTitle"]()}
						</Button>
					</SheetTrigger>
					<SheetContent side="bottom" className="max-h-[80vh]">
						<SheetHeader>
							<SheetTitle>{m["voice.room.transcriptTitle"]()}</SheetTitle>
							<SheetDescription>{objective}</SheetDescription>
						</SheetHeader>
						<div className="overflow-hidden px-4 pb-4">{transcript}</div>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	);
}
