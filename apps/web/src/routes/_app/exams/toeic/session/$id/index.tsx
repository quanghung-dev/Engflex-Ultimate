import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { APP_ROUTES } from "#/app/app-route";
import {
	SessionPending,
	ToeicSession,
} from "#/features/exams/components/taking/toeic-session";
import { examAttemptQueryOptions } from "#/features/exams/queries";
import { ApiError } from "#/lib/api/api";

export const Route = createFileRoute("/_app/exams/toeic/session/$id/")({
	loader: async ({ context: { queryClient }, params: { id } }) => {
		if (!z.uuid().safeParse(id).success) throw notFound();
		try {
			const attempt = await queryClient.query({
				...examAttemptQueryOptions(id),
				staleTime: 0,
				retry: (count: number, error: unknown) =>
					!(
						error instanceof ApiError && [401, 404, 409].includes(error.status)
					) && count < 3,
			});
			if (attempt.status === "completed")
				throw redirect({
					to: APP_ROUTES.EXAMS.TOEIC.RESULT,
					params: { id },
					replace: true,
				});
			if (attempt.status !== "in_progress")
				throw redirect({ to: APP_ROUTES.EXAMS.TOEIC.HISTORY, replace: true });
			if (
				!attempt.result ||
				!attempt.examTest?.content?.parts.length ||
				attempt.examTest.category?.type !== "toeic" ||
				!attempt.startedAt ||
				(attempt.mode === "exam" && !attempt.deadlineAt)
			)
				throw new Error("Invalid exam session");
			return attempt;
		} catch (error) {
			if (error instanceof ApiError) {
				if (error.status === 404) throw notFound();
				if (error.status === 401)
					throw redirect({ href: APP_ROUTES.AUTH.SIGN_IN });
				if (error.status === 409)
					throw redirect({ to: APP_ROUTES.EXAMS.TOEIC.HISTORY, replace: true });
			}
			throw error;
		}
	},
	pendingComponent: SessionPending,
	component: SessionPage,
});
function SessionPage() {
	const attempt = Route.useLoaderData();
	return <ToeicSession key={attempt.id} initialAttempt={attempt} />;
}
