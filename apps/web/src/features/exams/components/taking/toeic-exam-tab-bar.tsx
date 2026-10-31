import { BookOpen, Headphones } from "lucide-react";

export interface PartMetaItem {
	partNum: number;
	section: "listening" | "reading";
	label: string;
	totalQuestions: number;
	answeredCount: number;
}

export function ToeicExamTabBar({
	parts,
	activePart,
	onSelectPart,
}: {
	parts: PartMetaItem[];
	activePart: number;
	onSelectPart: (partNum: number) => void;
}) {
	const listeningParts = parts.filter((p) => p.section === "listening");
	const readingParts = parts.filter((p) => p.section === "reading");

	return (
		<div className="flex h-11 w-full shrink-0 items-center border-b border-border/80 bg-muted/20 px-4 overflow-x-auto select-none scrollbar-none">
			<div className="flex items-center gap-1">
				{/* Listening Group */}
				<span className="flex size-7 shrink-0 items-center justify-center text-muted-foreground mr-1">
					<Headphones className="size-4" aria-hidden="true" />
				</span>

				{listeningParts.map((part) => {
					const isActive = activePart === part.partNum;
					return (
						<button
							key={part.partNum}
							type="button"
							onClick={() => onSelectPart(part.partNum)}
							className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
								isActive
									? "bg-[#1e293b] text-white shadow-xs dark:bg-slate-800"
									: "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
							}`}
						>
							<span>{part.label}</span>
							<span
								className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
									isActive
										? "bg-white/20 text-white"
										: part.answeredCount > 0
											? "bg-sky-500/20 text-sky-600 dark:text-sky-400"
											: "bg-muted text-muted-foreground"
								}`}
							>
								{part.answeredCount}/{part.totalQuestions}
							</span>
						</button>
					);
				})}

				{/* Reading Group */}
				<span className="flex size-7 shrink-0 items-center justify-center text-muted-foreground ml-3 mr-1">
					<BookOpen className="size-4" aria-hidden="true" />
				</span>

				{readingParts.map((part) => {
					const isActive = activePart === part.partNum;
					return (
						<button
							key={part.partNum}
							type="button"
							onClick={() => onSelectPart(part.partNum)}
							className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
								isActive
									? "bg-[#1e293b] text-white shadow-xs dark:bg-slate-800"
									: "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
							}`}
						>
							<span>{part.label}</span>
							<span
								className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
									isActive
										? "bg-white/20 text-white"
										: part.answeredCount > 0
											? "bg-sky-500/20 text-sky-600 dark:text-sky-400"
											: "bg-muted text-muted-foreground"
								}`}
							>
								{part.answeredCount}/{part.totalQuestions}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
