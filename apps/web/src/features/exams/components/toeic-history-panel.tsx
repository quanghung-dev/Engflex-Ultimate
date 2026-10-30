import { ArrowRight, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { m } from "#/paraglide/messages";

export interface ToeicAttemptItem {
	id: string;
	title: string;
	mode: "exam" | "practice";
	status: "in_progress" | "completed";
	date: string;
	scorePct?: number;
}

export function ToeicHistoryPanel({
	attempts,
}: {
	attempts: ToeicAttemptItem[];
}) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-base font-bold text-foreground">
					<Clock className="size-5 text-sky-600" aria-hidden="true" />
					<span>{m["exams.toeic.hub.history.title"]()}</span>
				</div>
				<button
					type="button"
					className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
				>
					<span>{m["exams.toeic.hub.history.viewAll"]()}</span>
					<ArrowRight className="size-3.5" aria-hidden="true" />
				</button>
			</div>

			<div className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border/80 bg-card shadow-sm">
				{attempts.map((attempt) => (
					<div
						key={attempt.id}
						className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="flex items-center gap-3 min-w-0">
							{attempt.status === "in_progress" ? (
								<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400">
									<PlayCircle className="size-5" aria-hidden="true" />
								</span>
							) : (
								<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400">
									<CheckCircle2 className="size-5" aria-hidden="true" />
								</span>
							)}

							<div className="flex flex-col gap-1 min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<h4 className="truncate text-sm font-bold text-foreground">
										{attempt.title}
									</h4>
									<span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
										{attempt.mode === "exam"
											? m["exams.toeic.hub.history.modeExam"]()
											: m["exams.toeic.hub.history.modePractice"]()}
									</span>
								</div>
								<div className="text-xs text-muted-foreground">
									{attempt.date}
									{attempt.scorePct !== undefined && ` • ${attempt.scorePct}%`}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 self-end sm:self-center shrink-0">
							{attempt.status === "in_progress" ? (
								<>
									<button
										type="button"
										className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-700"
									>
										{m["exams.toeic.hub.history.cancel"]()}
									</button>
									<button
										type="button"
										className="inline-flex items-center gap-1 rounded-lg bg-[#1e293b] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#0f172a] dark:bg-slate-800 dark:hover:bg-slate-700"
									>
										<span>{m["exams.toeic.hub.history.continue"]()}</span>
										<ArrowRight className="size-3.5" aria-hidden="true" />
									</button>
								</>
							) : (
								<button
									type="button"
									className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
								>
									<span>{m["exams.toeic.hub.history.viewResult"]()}</span>
									<ArrowRight className="size-3.5" aria-hidden="true" />
								</button>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
