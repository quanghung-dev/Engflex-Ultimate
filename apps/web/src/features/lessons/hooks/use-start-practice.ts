import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { lessonKeys, useStartLessonAttempt } from "#/features/lessons/queries";
import { m } from "#/paraglide/messages";

/**
 * Click-event run opener: starts (or reuses) the open attempt for a lesson,
 * then navigates to practice. Mounts never write — PracticeInner only reads
 * the open run — so StrictMode/HMR remounts are pure reads by construction.
 * The server start is idempotent, so double-clicks and two-tab races
 * converge on one run; `pending` drives the entry SubmitButton spinner, and
 * the in-hook guard blocks the second navigation.
 */
export function useStartPractice() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const start = useStartLessonAttempt();

	async function begin(slug: string, lessonId: string) {
		if (start.isPending) return;
		try {
			await start.mutateAsync(lessonId);
			// Evict the open-run cache: it may hold the previous (possibly
			// completed) run, and the mount must fetch current truth rather
			// than render stale seeds. Evict — don't synthesize — because the
			// POST may have reused an open run with real progress.
			queryClient.removeQueries({
				queryKey: lessonKeys.openAttempt(lessonId),
			});
			await navigate({
				to: APP_ROUTES.LESSONS.PRACTICE,
				params: { slug },
			});
		} catch {
			toast.error(m["lessons.attempt.failed"]());
		}
	}

	return { begin, pending: start.isPending };
}
