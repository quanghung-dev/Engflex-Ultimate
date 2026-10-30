import { Check, Minus, Play, Volume2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export interface ReviewOption {
	key: string;
	text: string;
	translation: string;
}

export interface ReviewQuestion {
	id: string;
	questionNumber: number;
	partNum: number;
	prompt?: string;
	imageUrl?: string;
	imageAlt?: string;
	audioDuration?: number;
	options: ReviewOption[];
	correctKey: string;
	userKey?: string | null; // null or undefined means skipped ("Bỏ qua")
	explanation?: string;
}

interface ToeicResultReviewSectionProps {
	questions: ReviewQuestion[];
	activePart: number;
	onSelectPart: (partNum: number) => void;
	selectedFilter: "all" | "incorrect" | "correct";
	onSelectFilter: (filter: "all" | "incorrect" | "correct") => void;
}

export function ToeicResultReviewSection({
	questions,
	activePart,
	onSelectPart,
	selectedFilter,
	onSelectFilter,
}: ToeicResultReviewSectionProps) {
	const [isPlayingAudio, setIsPlayingAudio] = useState(false);

	// Filter questions by active part and selected status
	const partQuestions = questions.filter((q) => q.partNum === activePart);
	const filteredQuestions = partQuestions.filter((q) => {
		const isCorrect = q.userKey === q.correctKey;
		const isSkippedOrWrong = !isCorrect; // câu bỏ qua tính là câu sai luôn

		if (selectedFilter === "incorrect") return isSkippedOrWrong;
		if (selectedFilter === "correct") return isCorrect;
		return true;
	});

	return (
		<div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-xs md:p-8">
			{/* Header Title */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-base font-bold text-foreground uppercase md:text-lg">
					{m["exams.toeic.result.reviewTitle"]()}
				</h2>

				{/* Filter Tabs: Tất cả / Câu sai / Câu đúng */}
				<div className="flex items-center gap-1 rounded-xl bg-muted p-1 text-xs font-semibold">
					<button
						type="button"
						onClick={() => onSelectFilter("all")}
						className={`rounded-lg px-3 py-1.5 transition-colors ${
							selectedFilter === "all"
								? "bg-background text-foreground shadow-xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{m["exams.toeic.result.filterAll"]()}
					</button>
					<button
						type="button"
						onClick={() => onSelectFilter("incorrect")}
						className={`rounded-lg px-3 py-1.5 transition-colors ${
							selectedFilter === "incorrect"
								? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold shadow-xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{m["exams.toeic.result.filterIncorrect"]()}
					</button>
					<button
						type="button"
						onClick={() => onSelectFilter("correct")}
						className={`rounded-lg px-3 py-1.5 transition-colors ${
							selectedFilter === "correct"
								? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{m["exams.toeic.result.filterCorrect"]()}
					</button>
				</div>
			</div>

			{/* Part Navigation Pills (Part 1 to Part 7) */}
			<div className="flex flex-wrap gap-2 border-b border-border/60 pb-4">
				{[1, 2, 3, 4, 5, 6, 7].map((pNum) => {
					const isActive = activePart === pNum;
					return (
						<button
							key={pNum}
							type="button"
							onClick={() => onSelectPart(pNum)}
							className={`rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
								isActive
									? "bg-primary text-primary-foreground shadow-xs"
									: "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							Part {pNum}
						</button>
					);
				})}
			</div>

			{/* Audio player bar for listening parts (P1-P4) */}
			{activePart <= 4 && (
				<div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/40 p-3 sm:px-4">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={() => setIsPlayingAudio((prev) => !prev)}
						className="size-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
					>
						<Play
							className={`size-4 ${isPlayingAudio ? "fill-current" : ""}`}
							aria-hidden="true"
						/>
					</Button>
					<span className="text-xs font-mono font-medium text-muted-foreground">
						0:00 / 0:28
					</span>
					<div className="relative h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
						<div className="h-full w-0 bg-primary transition-all" />
					</div>
					<Volume2
						className="size-4 text-muted-foreground"
						aria-hidden="true"
					/>
				</div>
			)}

			{/* Questions List */}
			{filteredQuestions.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
					<p className="text-sm">Không có câu hỏi nào khớp với bộ lọc này.</p>
				</div>
			) : (
				<div className="flex flex-col gap-6">
					{filteredQuestions.map((q) => {
						const isSkipped = !q.userKey;
						const isCorrect = q.userKey === q.correctKey;

						return (
							<div
								key={q.id}
								id={`question-${q.questionNumber}`}
								className="flex flex-col gap-4 rounded-xl border border-border/80 bg-background/50 p-5 shadow-xs transition-colors scroll-mt-24 md:p-6"
							>
								{/* Question Header Status */}
								<div className="flex items-center gap-3">
									{/* Status Icon */}
									{isCorrect ? (
										<div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
											<Check className="size-3.5" aria-hidden="true" />
										</div>
									) : isSkipped ? (
										<div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
											<Minus className="size-3.5" aria-hidden="true" />
										</div>
									) : (
										<div className="flex size-6 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
											<X className="size-3.5" aria-hidden="true" />
										</div>
									)}

									<span className="text-sm font-bold text-foreground">
										Câu {q.questionNumber}
									</span>

									{/* Status Badge */}
									{isCorrect ? (
										<Badge
											variant="outline"
											className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
										>
											{m["exams.toeic.result.correctBadge"]()}
										</Badge>
									) : isSkipped ? (
										<Badge
											variant="outline"
											className="border-border bg-muted text-muted-foreground text-xs font-semibold"
										>
											{m["exams.toeic.result.skippedBadge"]()}
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-semibold"
										>
											{m["exams.toeic.result.incorrectBadge"]()}
										</Badge>
									)}
								</div>

								{/* Image (for Part 1 or graphic questions) */}
								{q.imageUrl && (
									<div className="relative mt-2 overflow-hidden rounded-xl border border-border max-w-md">
										<img
											src={q.imageUrl}
											alt={q.imageAlt || `Question ${q.questionNumber}`}
											className="h-auto w-full object-cover"
										/>
									</div>
								)}

								{/* Prompt / Stem */}
								{q.prompt && (
									<p className="text-sm font-medium leading-relaxed text-foreground md:text-base">
										{q.prompt}
									</p>
								)}

								{/* Options List */}
								<div className="flex flex-col gap-2.5">
									{q.options.map((opt) => {
										const isOptionCorrect = opt.key === q.correctKey;
										const isUserSelected = q.userKey === opt.key;

										let optionStyle =
											"border-border/70 bg-card hover:bg-muted/30";
										let keyStyle =
											"border-border bg-muted/50 text-muted-foreground";

										if (isOptionCorrect) {
											optionStyle =
												"border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20";
											keyStyle =
												"border-emerald-500 bg-emerald-500 text-white dark:text-emerald-950 font-bold";
										} else if (isUserSelected && !isOptionCorrect) {
											optionStyle =
												"border-rose-500 bg-rose-500/10 dark:bg-rose-950/20";
											keyStyle =
												"border-rose-500 bg-rose-500 text-white font-bold";
										}

										return (
											<div
												key={opt.key}
												className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${optionStyle}`}
											>
												<span
													className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${keyStyle}`}
												>
													{opt.key}
												</span>
												<div className="flex flex-col">
													<span className="text-sm font-medium text-foreground">
														{opt.text}
													</span>
													{opt.translation && (
														<span className="mt-0.5 text-xs text-muted-foreground">
															{opt.translation}
														</span>
													)}
												</div>
											</div>
										);
									})}
								</div>

								{/* Explanation Box */}
								{q.explanation && (
									<div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs leading-relaxed text-foreground dark:bg-blue-950/20 md:text-sm">
										<span className="font-bold text-blue-600 dark:text-blue-400">
											{m["exams.toeic.result.explanationLabel"]()}{" "}
										</span>
										{q.explanation}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
