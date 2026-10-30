import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { m } from "#/paraglide/messages";

export interface PaletteGroup {
	partNum: number;
	title: string;
	questions: number[]; // e.g. [1, 2, 3, 4, 5, 6]
}

export function ToeicQuestionPalette({
	isCollapsed,
	onToggleCollapse,
	groups,
	activeQuestionNumber,
	answers,
	bookmarks,
	onSelectQuestion,
}: {
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	groups: PaletteGroup[];
	activeQuestionNumber: number;
	answers: Record<string, string>;
	bookmarks: Set<string>;
	onSelectQuestion: (questionNum: number) => void;
}) {
	const totalQuestions = groups.reduce((acc, g) => acc + g.questions.length, 0);
	const answeredCount = Object.keys(answers).length;
	const pct =
		totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

	return (
		<div className="relative flex h-full">
			{/* Collapse / Expand Toggle Button on left edge */}
			<button
				type="button"
				onClick={onToggleCollapse}
				className="absolute -left-3.5 top-1/2 z-20 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
				aria-label={
					isCollapsed
						? "Expand questions palette"
						: "Collapse questions palette"
				}
			>
				{isCollapsed ? (
					<ChevronLeft className="size-4" />
				) : (
					<ChevronRight className="size-4" />
				)}
			</button>

			{/* Palette Content Panel */}
			<div
				className={`flex h-full flex-col border-l border-border/80 bg-card transition-all duration-200 ${
					isCollapsed ? "w-0 overflow-hidden border-none" : "w-64 md:w-72"
				}`}
			>
				{/* Progress Header */}
				<div className="flex flex-col gap-2 border-b border-border/70 p-4">
					<div className="flex items-center justify-between text-xs font-bold text-foreground">
						<span>{m["exams.toeic.take.progress"]()}</span>
						<span className="font-mono text-muted-foreground">
							{answeredCount}/{totalQuestions} ({pct}%)
						</span>
					</div>

					<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-emerald-600 transition-all duration-300"
							style={{ width: `${pct}%` }}
						/>
					</div>
				</div>

				{/* Scrollable Questions Groups */}
				<div className="flex-1 overflow-y-auto p-4 space-y-5 select-none">
					{groups.map((group) => (
						<div key={group.partNum} className="flex flex-col gap-2">
							<span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
								{group.title}
							</span>

							<div className="grid grid-cols-5 gap-1.5">
								{group.questions.map((num) => {
									const qId = `q-${num}`;
									const isAnswered = answers[qId] != null;
									const isBookmarked = bookmarks.has(qId);
									const isActive = activeQuestionNumber === num;

									return (
										<button
											key={num}
											type="button"
											onClick={() => onSelectQuestion(num)}
											className={`relative flex size-8 items-center justify-center rounded-md text-xs font-semibold transition-all ${
												isActive
													? "border-2 border-foreground font-bold shadow-xs"
													: isAnswered
														? "bg-sky-500 text-white font-bold"
														: "border border-border/70 bg-background text-foreground hover:bg-muted"
											}`}
										>
											{num}
											{isBookmarked && (
												<span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-400 ring-1 ring-background" />
											)}
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>

				{/* Floating Bottom Help / Feedback Pill */}
				<div className="p-3 border-t border-border/60 flex items-center justify-end">
					<button
						type="button"
						className="flex size-9 items-center justify-center rounded-full bg-[#1e293b] text-white shadow-md hover:bg-[#0f172a] dark:bg-slate-800"
						title="Hỗ trợ & Góp ý"
					>
						<MessageSquare className="size-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
