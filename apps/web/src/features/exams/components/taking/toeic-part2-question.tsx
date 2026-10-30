import { Bookmark } from "lucide-react";
import { m } from "#/paraglide/messages";
import { ToeicAudioPlayer } from "./toeic-audio-player";

export interface Part2QuestionItem {
	id: string;
	questionNumber: number;
	audioDuration: number;
}

export function ToeicPart2Question({
	item,
	selectedOption,
	isBookmarked,
	onSelectOption,
	onToggleBookmark,
}: {
	item: Part2QuestionItem;
	selectedOption?: string;
	isBookmarked?: boolean;
	onSelectOption: (option: string) => void;
	onToggleBookmark: () => void;
}) {
	const options = ["A", "B", "C"];

	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs md:p-5">
			{/* Top Audio Bar */}
			<ToeicAudioPlayer duration={item.audioDuration} />

			{/* Question Card */}
			<div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
				<div className="flex items-center justify-between border-b border-border/50 pb-2.5">
					<span className="text-sm font-bold text-foreground">
						Câu {item.questionNumber}
					</span>

					<button
						type="button"
						onClick={onToggleBookmark}
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

				<div className="flex items-center gap-3 pt-1">
					{options.map((opt) => {
						const isSelected = selectedOption === opt;
						return (
							<button
								key={opt}
								type="button"
								onClick={() => onSelectOption(opt)}
								className={`flex size-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${
									isSelected
										? "border-2 border-foreground bg-[#1e293b] text-white shadow-xs dark:bg-slate-800"
										: "border border-border/80 bg-background text-foreground hover:bg-muted"
								}`}
							>
								{opt}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
