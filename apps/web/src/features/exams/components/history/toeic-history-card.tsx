import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock } from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export interface ToeicHistoryAttemptItem {
	id: string;
	title: string;
	mode: "exam" | "practice";
	partBadge?: string;
	status: "in_progress" | "completed";
	score?: string;
	duration: string;
	date: string;
}

interface ToeicHistoryCardProps {
	item: ToeicHistoryAttemptItem;
	onCancel: (item: ToeicHistoryAttemptItem) => void;
}

export function ToeicHistoryCard({ item, onCancel }: ToeicHistoryCardProps) {
	const isCompleted = item.status === "completed";

	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-border sm:flex-row sm:items-center sm:justify-between sm:gap-6">
			{/* Left Column: Title & Metadata */}
			<div className="flex flex-col gap-2 min-w-0">
				{/* Top Row: Title + Mode/Part Badge */}
				<div className="flex flex-wrap items-center gap-2.5">
					<h3 className="text-base font-bold text-foreground truncate">
						{item.title}
					</h3>
					{item.partBadge ? (
						<Badge
							variant="outline"
							className="rounded-md border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground"
						>
							{item.partBadge}
						</Badge>
					) : (
						<Badge
							variant="outline"
							className="rounded-md border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground"
						>
							{item.mode === "exam"
								? m["exams.toeic.hub.history.modeExam"]()
								: m["exams.toeic.hub.history.modePractice"]()}
						</Badge>
					)}
				</div>

				{/* Bottom Row: Score + Duration + Date + Check */}
				<div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground sm:text-sm">
					{isCompleted && item.score && (
						<span className="font-bold text-foreground">{item.score}</span>
					)}

					<span className="inline-flex items-center gap-1">
						<Clock className="size-3.5" aria-hidden="true" />
						{item.duration}
					</span>

					<span>{item.date}</span>

					{isCompleted && (
						<CheckCircle2
							className="size-4 text-emerald-500"
							aria-hidden="true"
						/>
					)}
				</div>
			</div>

			{/* Right Column: Action Buttons */}
			<div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
				{isCompleted ? (
					<Button
						asChild
						variant="outline"
						className="rounded-xl border-border/90 px-5 py-2 text-xs font-bold tracking-wide hover:bg-muted"
					>
						<Link to={APP_ROUTES.EXAMS.TOEIC.RESULT} params={{ id: item.id }}>
							{m["exams.toeic.hub.history.viewResult"]()}
						</Link>
					</Button>
				) : (
					<>
						<Button
							type="button"
							onClick={() => onCancel(item)}
							className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold tracking-wide text-white hover:bg-rose-700 active:bg-rose-800"
						>
							{m["exams.toeic.hub.history.cancel"]()}
						</Button>

						<Button
							asChild
							className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold tracking-wide text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
						>
							<Link
								to={APP_ROUTES.EXAMS.TOEIC.SESSION}
								params={{ id: item.id }}
							>
								{m["exams.toeic.hub.history.continue"]()}
							</Link>
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
