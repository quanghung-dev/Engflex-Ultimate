import type { TranscriptResult } from "@engflex/contracts";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import { useCallback, useState } from "react";
import {
	type TranscriptAction,
	transcriptCommand,
} from "#/features/voice/service";
import { ApiError } from "#/lib/api";

/**
 * The correction modal.
 *
 * The learner opens it; nothing opens it for them, and no confidence signal
 * decides anything. From the moment it opens the engine has their microphone,
 * so the modal is the only thing they can act on until they send or dismiss.
 *
 * `text` is the field, and the field is the one true copy. It is seeded by
 * `review`, replaced whenever the engine announces a spoken attempt, and
 * editable at all times — including while the engine is listening, which is why
 * typing and speaking are two ways to fill one thing rather than two fields.
 * The engine deliberately keeps no copy of its own.
 *
 * RTVI is inbound-only here, for the one thing the client cannot ask for: the
 * engine announcing that a spoken attempt was captured.
 */
export type CorrectionWindow = {
	/** The field: the transcript under review, typed or spoken. */
	text: string;
	/** True while the engine is listening for a spoken attempt. */
	capturing: boolean;
	/** True once the learner has spoken at least once this window. */
	held: boolean;
	submitting: boolean;
	error: string | null;
};

export function useCorrectionModal(
	conversationId: string | null,
	options: { onCorrected?: (text: string) => void } = {},
) {
	const { onCorrected } = options;
	const [window, setWindow] = useState<CorrectionWindow | null>(null);

	const close = useCallback(() => setWindow(null), []);

	// The engine is the only source of truth for the window's STATE, so every
	// action asks it and takes its answer. A 404 means the session ended
	// underneath us, which closes the modal rather than stranding the learner.
	const run = useCallback(
		async (action: TranscriptAction, text?: string) => {
			if (!conversationId) return;
			setWindow((w) => (w ? { ...w, submitting: true, error: null } : w));
			try {
				const result: TranscriptResult = await transcriptCommand(
					conversationId,
					action,
					text,
				);
				if (action === "dismiss" || result.state === "idle") {
					// The engine accepted the correction, so the transcript on
					// screen is now behind the truth. Tell the panel, which owns
					// what is displayed and needs the moment to correct it.
					if (action === "send") {
						onCorrected?.(result.text ?? text ?? "");
					}
					close();
					return;
				}
				// Read the field from the updater, not from a closure: `retake`
				// answers with no text at all, and the field must survive it.
				setWindow((w) =>
					w
						? {
								text: result.text ?? w.text,
								capturing: result.state === "capturing",
								held: result.state === "holding",
								submitting: false,
								error: null,
							}
						: w,
				);
			} catch (err) {
				if (err instanceof ApiError && err.status === 404) {
					close();
					return;
				}
				setWindow((w) =>
					w ? { ...w, submitting: false, error: messageOf(err) } : w,
				);
			}
		},
		[conversationId, close, onCorrected],
	);

	// Open: the engine replies with its own copy of the turn, which is exactly
	// what Send will rewrite.
	const open = useCallback(async () => {
		if (!conversationId) return;
		setWindow({
			text: "",
			capturing: false,
			held: false,
			submitting: true,
			error: null,
		});
		try {
			const result = await transcriptCommand(conversationId, "review");
			setWindow({
				text: result.text ?? "",
				capturing: false,
				held: false,
				submitting: false,
				error: null,
			});
		} catch (err) {
			if (err instanceof ApiError && err.status === 404) {
				close();
				return;
			}
			setWindow(null);
		}
	}, [conversationId, close]);

	// A spoken attempt was captured: it becomes the field. Whatever was there
	// before is simply replaced — the learner re-spoke precisely because they
	// did not want it.
	const onServerMessage = useCallback((data: unknown) => {
		if (!data || typeof data !== "object") return;
		const msg = data as { type?: unknown; state?: unknown; text?: unknown };
		if (msg.type !== "transcript.correction_ready") return;
		if (msg.state !== "holding") return;
		setWindow((w) =>
			w
				? {
						...w,
						text: typeof msg.text === "string" ? msg.text : w.text,
						capturing: false,
						held: true,
					}
				: w,
		);
	}, []);

	useRTVIClientEvent(RTVIEvent.ServerMessage, onServerMessage);

	return {
		window,
		open,
		close,
		// The field is the field: every keystroke lands in the one place the
		// engine will read it back from, so there is no second copy to drift.
		edit: useCallback((text: string) => {
			setWindow((w) => (w ? { ...w, text } : w));
		}, []),
		speakAgain: useCallback(() => void run("retake"), [run]),
		send: useCallback((text: string) => void run("send", text), [run]),
		dismiss: useCallback(() => void run("dismiss"), [run]),
	};
}

function messageOf(err: unknown): string {
	if (err instanceof ApiError) return err.message;
	return "Something went wrong. Please try again.";
}
