import { createFileRoute, Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { BackButton } from "#/components/common/back-button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import {
	type ToeicHistoryAttemptItem,
	ToeicHistoryCard,
} from "#/features/exams/components/history/toeic-history-card";
import { m } from "#/paraglide/messages";

/* ------------------------------------------------------------------ Mock Data */

const INITIAL_MOCK_HISTORY: ToeicHistoryAttemptItem[] = [
	{
		id: "test-1-attempt-1",
		title: "Parroto TOEIC Practice Vol. 1 - Test 1",
		mode: "exam",
		status: "completed",
		score: "10/990",
		duration: "2m",
		date: "30/10/2026",
	},
	{
		id: "test-1-attempt-2",
		title: "Parroto TOEIC Practice Vol. 1 - Test 1",
		mode: "practice",
		status: "in_progress",
		duration: "0m",
		date: "30/10/2026",
	},
	{
		id: "test-1-attempt-3",
		title: "Parroto TOEIC Practice Vol. 1 - Test 1",
		mode: "exam",
		status: "in_progress",
		duration: "0m",
		date: "30/10/2026",
	},
	{
		id: "test-1-attempt-4",
		title: "Parroto TOEIC Practice Vol. 1 - Test 1",
		mode: "exam",
		status: "completed",
		score: "10/990",
		duration: "3h45m",
		date: "30/10/2026",
	},
	{
		id: "test-3-attempt-1",
		title: "TOEIC 2026 - Test 3",
		mode: "practice",
		partBadge: "P5",
		status: "completed",
		score: "19/30 (63%)",
		duration: "2h39m",
		date: "08/07/2026",
	},
];

/* ------------------------------------------------------------------ Page Component */

export const Route = createFileRoute("/_app/exams/toeic/history")({
	component: ToeicHistoryPage,
});

function ToeicHistoryPage() {
	const [attempts, setAttempts] =
		useState<ToeicHistoryAttemptItem[]>(INITIAL_MOCK_HISTORY);
	const [attemptToCancel, setAttemptToCancel] =
		useState<ToeicHistoryAttemptItem | null>(null);

	useBreadcrumbs([
		{ label: m["exams.toeic.hub.title"](), to: APP_ROUTES.EXAMS.TOEIC.LIST },
		{ label: m["exams.toeic.hub.history.title"]() },
	]);

	const handleConfirmCancel = () => {
		if (!attemptToCancel) return;
		setAttempts((prev) => prev.filter((a) => a.id !== attemptToCancel.id));
		toast.success(m["exams.toeic.hub.history.cancelSuccess"]());
		setAttemptToCancel(null);
	};

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-20">
			{/* Top Back Navigation to TOEIC List */}
			<div className="flex items-center">
				<BackButton
					to={APP_ROUTES.EXAMS.TOEIC.LIST}
					label={m["exams.toeic.category.back"]()}
				/>
			</div>

			{/* Page Title */}
			<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
				{m["exams.toeic.hub.history.title"]()}
			</h1>

			{/* History List or Empty State */}
			{attempts.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
					<div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
						<History className="size-7" aria-hidden="true" />
					</div>
					<h3 className="mt-4 text-base font-bold text-foreground">
						{m["exams.toeic.hub.history.emptyTitle"]()}
					</h3>
					<p className="mt-1.5 max-w-sm text-xs text-muted-foreground sm:text-sm">
						{m["exams.toeic.hub.history.emptyDesc"]()}
					</p>
					<Button asChild className="mt-6 rounded-xl font-bold">
						<Link to={APP_ROUTES.EXAMS.TOEIC.LIST}>
							{m["exams.toeic.hub.history.emptyAction"]()}
						</Link>
					</Button>
				</div>
			) : (
				<div className="flex flex-col gap-3.5">
					{attempts.map((attempt) => (
						<ToeicHistoryCard
							key={attempt.id}
							item={attempt}
							onCancel={(item) => setAttemptToCancel(item)}
						/>
					))}
				</div>
			)}

			{/* Confirm Cancel Alert Dialog */}
			<AlertDialog
				open={attemptToCancel != null}
				onOpenChange={(open) => {
					if (!open) setAttemptToCancel(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{m["exams.toeic.hub.history.cancelDialogTitle"]()}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{m["exams.toeic.hub.history.cancelDialogDesc"]()}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{m["exams.toeic.hub.history.cancelDialogCancel"]()}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmCancel}
							className="bg-rose-600 text-white hover:bg-rose-700"
						>
							{m["exams.toeic.hub.history.cancelDialogConfirm"]()}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
