import { Bookmark } from "lucide-react";
import { m } from "#/paraglide/messages";

export interface Part5QuestionItem {
	id: string;
	questionNumber: number;
	sentence: string;
	options: {
		key: "A" | "B" | "C" | "D";
		text: string;
	}[];
}

export function ToeicPart5Question({
	item,
	selectedOption,
	isBookmarked,
	onSelectOption,
	onToggleBookmark,
}: {
	item: Part5QuestionItem;
	selectedOption?: string;
	isBookmarked?: boolean;
	onSelectOption: (option: string) => void;
	onToggleBookmark: () => void;
}) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs md:p-5">
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

			{/* Fill-in-the-blank Sentence */}
			<p className="text-xs font-medium leading-relaxed text-foreground md:text-sm">
				{item.sentence}
			</p>

			{/* 4 Vertical Options */}
			<div className="flex flex-col gap-2 pt-1">
				{item.options.map((opt) => {
					const isSelected = selectedOption === opt.key;
					return (
						<button
							key={opt.key}
							type="button"
							onClick={() => onSelectOption(opt.key)}
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
}
