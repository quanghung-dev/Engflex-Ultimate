import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import type { CorrectionWindow } from "#/features/voice/hooks/use-correction-modal";
import { m } from "#/paraglide/messages";

/**
 * The correction modal.
 *
 * It is modal for a reason beyond focus management: from the moment it opens
 * the engine holds the learner's microphone, so nothing said in this room can
 * commit a turn until they send or dismiss. An inline card could not own the
 * conversation like that.
 *
 * Escape, the close button and outside-click all dismiss, which is the safe
 * direction — there is no path that leaves someone muted.
 *
 * One field, two ways to fill it. Typing edits `window.text` in place;
 * "Speak again" hands the microphone to the engine, whose transcription then
 * replaces the field. The two are deliberately not stacked or interleaved, and
 * the box is never swapped out for a listening label — a learner re-speaking
 * still needs to read what they are correcting.
 */
export function CorrectionModal({
	window,
	onSubmit,
	onEdit,
	onSpeakAgain,
	onDismiss,
}: {
	window: CorrectionWindow;
	onSubmit: (text: string) => void;
	onEdit: (text: string) => void;
	onSpeakAgain: () => void;
	onDismiss: () => void;
}) {
	const canSend =
		!window.submitting && !window.capturing && window.text.trim().length > 0;

	return (
		<Dialog open onOpenChange={(open) => !open && onDismiss()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{m["voice.room.recovery.title"]()}</DialogTitle>
					<DialogDescription>
						{window.held
							? m["voice.room.recovery.heldSubtitle"]()
							: m["voice.room.recovery.subtitle"]()}
					</DialogDescription>
				</DialogHeader>

				{/* <output> carries an implicit role="status", so the listening
				    state is announced without a redundant role. It is a sibling of
				    the field, not a replacement for it. */}
				{window.capturing && (
					<output className="animate-pulse text-sm text-muted-foreground">
						{m["voice.room.recovery.listening"]()}
					</output>
				)}

				<Textarea
					value={window.text}
					onChange={(e) => onEdit(e.target.value)}
					rows={3}
					autoFocus
					aria-label={m["voice.room.recovery.yourEdit"]()}
				/>

				{window.error && (
					<p className="text-xs text-destructive" role="alert">
						{window.error}
					</p>
				)}

				<DialogFooter className="gap-2 sm:justify-between">
					<Button type="button" variant="ghost" onClick={onDismiss}>
						{m["voice.room.recovery.dismiss"]()}
					</Button>
					<div className="flex gap-2">
						{/* Available for as many attempts as the learner wants: each
						    one replaces the field, and none of them commits anything
						    until Send. */}
						{!window.capturing && (
							<Button
								type="button"
								variant="outline"
								onClick={onSpeakAgain}
								disabled={window.submitting}
							>
								{m["voice.room.recovery.speakAgain"]()}
							</Button>
						)}
						<Button
							type="button"
							disabled={!canSend}
							onClick={() => onSubmit(window.text)}
						>
							{window.held
								? m["voice.room.recovery.sendIt"]()
								: m["voice.room.recovery.send"]()}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
