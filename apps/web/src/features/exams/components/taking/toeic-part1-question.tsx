import { Bookmark } from "lucide-react";
import { m } from "#/paraglide/messages";
import { ToeicAudioPlayer } from "./toeic-audio-player";

export interface Part1QuestionItem {
	id: string;
	questionNumber: number;
	imageUrl: string;
	imageAlt: string;
	audioDuration: number;
}

export function ToeicPart1Question({
	item,
	selectedOption,
	isBookmarked,
	onSelectOption,
	onToggleBookmark,
}: {
	item: Part1QuestionItem;
	selectedOption?: string;
	isBookmarked?: boolean;
	onSelectOption: (option: string) => void;
	onToggleBookmark: () => void;
}) {
	const options = ["A", "B", "C", "D"];

	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-xs md:flex-row md:items-start md:gap-6 md:p-6">
			{/* Left Column: Photo & Audio */}
			<div className="flex flex-col gap-3 md:w-5/12 lg:w-[42%] max-w-xl shrink-0">
				<div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-border/80 bg-muted">
					<img
						src={item.imageUrl}
						alt={item.imageAlt}
						className="h-full w-full object-cover grayscale"
						loading="lazy"
					/>
					<div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
						🦜 Parroto
					</div>
				</div>

				<ToeicAudioPlayer duration={item.audioDuration} />
			</div>

			{/* Right Column: Question & Options */}
			<div className="flex flex-1 flex-col justify-between self-stretch rounded-xl border border-border/60 bg-muted/20 p-4 md:p-5">
				<div className="flex items-center justify-between border-b border-border/50 pb-3">
					<span className="text-sm font-bold text-foreground md:text-base">
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

				<div className="flex items-center gap-3 pt-6 md:pt-10">
					{options.map((opt) => {
						const isSelected = selectedOption === opt;
						return (
							<button
								key={opt}
								type="button"
								onClick={() => onSelectOption(opt)}
								className={`flex size-11 items-center justify-center rounded-xl text-sm font-bold transition-all ${
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
