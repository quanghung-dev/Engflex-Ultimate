import { Mic, MicOff, Square } from "lucide-react";
import { SubmitButton } from "#/components/common/submit-button";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import type { CorrectionWindow } from "#/features/voice/hooks/use-correction-modal";
import { m } from "#/paraglide/messages";

/**
 * The correction modal, laid out after the "Clarify your message" mock:
 * title + dismiss, one editable field, Send left with Re-record/Cancel
 * right, and the mic-muted hint below.
 *
 * It is modal for a reason beyond focus management: from the moment it opens
 * the WebRTC mic track is muted, so nothing said in this room reaches the
 * live conversation until they send or dismiss.
 *
 * Escape, the close button and outside-click all dismiss, which is the safe
 * direction — dismissal restores the mic, so there is no path that leaves
 * someone muted.
 *
 * One field, two ways to fill it. Typing edits `window.text` in place;
 * Re-record captures a re-speak off-pipeline, whose transcription then
 * replaces the field. The two are deliberately not stacked or interleaved,
 * and the box is never swapped out for a status label — a learner
 * re-speaking still needs to read what they are correcting.
 */
export function CorrectionModal({
	window,
	onSubmit,
	onEdit,
	onRecord,
	onStop,
	onDismiss,
}: {
	window: CorrectionWindow;
	onSubmit: (text: string) => void;
	onEdit: (text: string) => void;
	onRecord: () => void;
	onStop: () => void;
	onDismiss: () => void;
}) {
	const canSend =
		!window.submitting &&
		!window.recording &&
		!window.uploading &&
		window.text.trim().length > 0;

	return (
		<Dialog open onOpenChange={(open) => !open && onDismiss()}>
			<DialogContent className="p-6 sm:max-w-xl sm:p-7">
				<div className="flex items-start justify-between gap-4 border-b border-border pb-4">
					<div>
						<DialogTitle className="text-lg font-semibold tracking-tight text-primary">
							{m["voice.room.recovery.title"]()}
						</DialogTitle>
						<DialogDescription className="mt-1 text-xs">
							{m["voice.room.recovery.subtitle"]()}
						</DialogDescription>
					</div>
				</div>

				<div className="mt-5">
					{/* <output> carries an implicit role="status", so the recording
					    state is announced without a redundant role. It is a sibling of
					    the field, not a replacement for it. */}
					{(window.recording || window.uploading) && (
						<output className="mb-2 block animate-pulse text-sm text-muted-foreground">
							{window.recording
								? m["voice.room.recovery.recording"]()
								: m["voice.room.recovery.transcribing"]()}
						</output>
					)}

					<Label htmlFor="correction-text" className="mb-1.5 block text-xs">
						{m["voice.room.recovery.yourEdit"]()}
					</Label>
					<Input
						id="correction-text"
						value={window.text}
						onChange={(e) => onEdit(e.target.value)}
						placeholder={m["voice.room.recovery.placeholder"]()}
						autoFocus
						aria-label={m["voice.room.recovery.yourEdit"]()}
					/>
					<p className="mt-1.5 px-0.5 text-xs text-muted-foreground">
						{m["voice.room.recovery.helper"]()}
					</p>

					{window.error && (
						<p className="mt-2 text-xs text-destructive" role="alert">
							{window.error}
						</p>
					)}
				</div>

				<div className="mt-2 border-t border-border pt-4">
					<div className="flex flex-wrap items-center justify-between gap-2.5">
						<SubmitButton
							type="button"
							disabled={!canSend}
							pending={window.submitting}
							onClick={() => onSubmit(window.text)}
						>
							{m["voice.room.recovery.send"]()}
						</SubmitButton>
						<div className="flex items-center gap-2">
							{/* Available for as many attempts as the learner wants: each
							    one replaces the field, and none of them commits anything
							    until Send. */}
							{window.recording ? (
								<Button
									type="button"
									variant="outline"
									onClick={onStop}
									disabled={window.submitting}
								>
									<Square data-icon="inline-start" />
									{m["voice.room.recovery.stop"]()}
								</Button>
							) : (
								<Button
									type="button"
									variant="outline"
									onClick={onRecord}
									disabled={window.submitting || window.uploading}
								>
									<Mic data-icon="inline-start" />
									{m["voice.room.recovery.record"]()}
								</Button>
							)}
							<Button type="button" variant="ghost" onClick={onDismiss}>
								{m["voice.room.recovery.cancel"]()}
							</Button>
						</div>
					</div>
					<div className="flex items-center justify-center pt-2">
						<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<MicOff className="size-3.5 shrink-0" />
							{m["voice.room.recovery.micMuted"]()}
						</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
