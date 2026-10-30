import { BookOpen, Clock, Headphones } from "lucide-react";
import { m } from "#/paraglide/messages";

interface ToeicResultHeaderCardProps {
	totalScore: number;
	listeningScore: number;
	readingScore: number;
	listeningCorrect: number;
	readingCorrect: number;
	durationText: string;
}

export function ToeicResultHeaderCard({
	totalScore,
	listeningScore,
	readingScore,
	listeningCorrect,
	readingCorrect,
	durationText,
}: ToeicResultHeaderCardProps) {
	return (
		<div className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 shadow-xs md:p-8">
			{/* Center Circular Total Score */}
			<div className="flex flex-col items-center">
				<div className="flex size-28 items-center justify-center rounded-full border-4 border-primary/20 bg-background text-center shadow-inner md:size-32">
					<div className="flex flex-col items-center justify-center">
						<span className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
							{totalScore}
						</span>
						<span className="text-xs font-semibold text-muted-foreground">
							/ 990
						</span>
					</div>
				</div>
				<span className="mt-3 text-base font-bold text-foreground">
					{m["exams.toeic.result.totalScore"]()}
				</span>
			</div>

			{/* Sub-cards: Listening & Reading Breakdown */}
			<div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
				{/* Listening Score Box */}
				<div className="flex flex-col items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-center dark:bg-blue-950/20">
					<div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
						<Headphones className="size-5" aria-hidden="true" />
					</div>
					<div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
						{listeningScore}
					</div>
					<div className="text-xs font-medium text-muted-foreground">/ 495</div>
					<div className="mt-2 text-xs font-semibold text-muted-foreground">
						{m["exams.toeic.result.correctCount"]({
							correct: listeningCorrect,
							total: 100,
						})}
					</div>
				</div>

				{/* Reading Score Box */}
				<div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center dark:bg-emerald-950/20">
					<div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
						<BookOpen className="size-5" aria-hidden="true" />
					</div>
					<div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
						{readingScore}
					</div>
					<div className="text-xs font-medium text-muted-foreground">/ 495</div>
					<div className="mt-2 text-xs font-semibold text-muted-foreground">
						{m["exams.toeic.result.correctCount"]({
							correct: readingCorrect,
							total: 100,
						})}
					</div>
				</div>
			</div>

			{/* Footer: Duration */}
			<div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
				<Clock className="size-3.5" aria-hidden="true" />
				<span>
					{m["exams.toeic.result.timeSpent"]({ duration: durationText })}
				</span>
			</div>
		</div>
	);
}
