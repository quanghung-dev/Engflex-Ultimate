import { m } from "#/paraglide/messages";

export type QuestionAttemptStatus = "correct" | "incorrect" | "skipped";

export interface PaletteCardQuestion {
	questionNumber: number;
	partNum: number;
	status: QuestionAttemptStatus;
}

export interface PaletteCardGroup {
	partNum: number;
	title: string;
	questions: PaletteCardQuestion[];
}

interface ToeicResultPaletteCardProps {
	groups: PaletteCardGroup[];
	onNavigateQuestion: (questionNumber: number, partNum: number) => void;
}

export function ToeicResultPaletteCard({
	groups,
	onNavigateQuestion,
}: ToeicResultPaletteCardProps) {
	return (
		<div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-xs md:p-8">
			{/* Card Title */}
			<h2 className="text-base font-bold tracking-tight text-foreground md:text-lg">
				{m["exams.toeic.result.questionPaletteTitle"]()}
			</h2>

			{/* Groups for Part 1 to Part 7 */}
			<div className="flex flex-col gap-5">
				{groups.map((group) => (
					<div key={group.partNum} className="flex flex-col gap-2">
						<span className="text-xs font-semibold text-muted-foreground">
							{group.title}
						</span>

						{/* Number Buttons in Flex Wrap */}
						<div className="flex flex-wrap gap-1.5 sm:gap-2">
							{group.questions.map((q) => {
								let style =
									"bg-muted/70 text-muted-foreground border-border/70 hover:bg-muted";

								if (q.status === "correct") {
									style =
										"border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs";
								} else if (q.status === "incorrect") {
									style =
										"border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-xs";
								}

								return (
									<button
										key={q.questionNumber}
										type="button"
										onClick={() =>
											onNavigateQuestion(q.questionNumber, q.partNum)
										}
										className={`flex size-7 sm:size-8 items-center justify-center rounded-full border text-[11px] sm:text-xs font-medium transition-all hover:scale-110 active:scale-95 ${style}`}
									>
										{q.questionNumber}
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>

			{/* Bottom Legend */}
			<div className="flex flex-wrap items-center gap-6 border-t border-border/60 pt-4 text-xs font-semibold">
				<div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
					<span className="size-2.5 rounded-full bg-emerald-500" />
					<span>{m["exams.toeic.result.legendCorrect"]()}</span>
				</div>
				<div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
					<span className="size-2.5 rounded-full bg-rose-500" />
					<span>{m["exams.toeic.result.legendIncorrect"]()}</span>
				</div>
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span className="size-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
					<span>{m["exams.toeic.result.legendSkipped"]()}</span>
				</div>
			</div>
		</div>
	);
}
