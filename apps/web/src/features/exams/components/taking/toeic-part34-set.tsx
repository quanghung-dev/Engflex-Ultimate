import { Bookmark } from "lucide-react";
import { m } from "#/paraglide/messages";
import { ToeicAudioPlayer } from "./toeic-audio-player";

export interface Part34QuestionItem {
	id: string;
	questionNumber: number;
	prompt: string;
	options: {
		key: "A" | "B" | "C" | "D";
		text: string;
	}[];
}

export interface Part34SetItem {
	setId: string;
	audioDuration: number;
	questions: Part34QuestionItem[];
}

export function ToeicPart34Set({
	set,
	answers,
	bookmarks,
	onSelectOption,
	onToggleBookmark,
}: {
	set: Part34SetItem;
	answers: Record<string, string>;
	bookmarks: Set<string>;
	onSelectOption: (questionId: string, option: string) => void;
	onToggleBookmark: (questionId: string) => void;
}) {
	return (
		<div className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs md:p-6">
			{/* Shared Audio Bar */}
			<ToeicAudioPlayer duration={set.audioDuration} />

			{/* Questions in set */}
			<div className="flex flex-col gap-6">
				{set.questions.map((q) => {
					const selectedOpt = answers[q.id];
					const isBookmarked = bookmarks.has(q.id);

					return (
						<div
							key={q.id}
							className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
						>
							<div className="flex items-center justify-between border-b border-border/50 pb-2">
								<span className="text-sm font-bold text-foreground">
									Câu {q.questionNumber}
								</span>

								<button
									type="button"
									onClick={() => onToggleBookmark(q.id)}
									className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
										isBookmarked
											? "text-amber-500 font-bold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<Bookmark
										className={`size-3.5 ${isBookmarked ? "fill-current" : ""}`}
									/>
									<span>
										{isBookmarked
											? m["exams.toeic.take.bookmarked"]()
											: m["exams.toeic.take.bookmark"]()}
									</span>
								</button>
							</div>

							<p className="text-xs font-medium leading-relaxed text-foreground md:text-sm">
								{q.prompt}
							</p>

							{/* 4 Vertical Options */}
							<div className="flex flex-col gap-2 pt-1">
								{q.options.map((opt) => {
									const isSelected = selectedOpt === opt.key;
									return (
										<button
											key={opt.key}
											type="button"
											onClick={() => onSelectOption(q.id, opt.key)}
											className={`flex items-center gap-3 rounded-xl border p-2.5 text-left text-xs transition-all md:text-sm ${
												isSelected
													? "border-foreground bg-muted/60 font-semibold shadow-2xs"
													: "border-border/70 bg-background hover:bg-muted/40"
											}`}
										>
											<span
												className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
													isSelected
														? "bg-[#1e293b] text-white dark:bg-slate-800"
														: "border border-border bg-muted text-muted-foreground"
												}`}
											>
												{opt.key}
											</span>
											<span className="flex-1 text-foreground">{opt.text}</span>
										</button>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
