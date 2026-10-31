import { Progress } from "#/components/ui/progress";
import { m } from "#/paraglide/messages";

export interface PartScoreItem {
	partNum: number;
	name: string;
	correctCount: number;
	totalQuestions: number;
}

interface ToeicResultPartsCardProps {
	parts: PartScoreItem[];
}

export function ToeicResultPartsCard({ parts }: ToeicResultPartsCardProps) {
	return (
		<div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xs md:p-8">
			<h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase md:text-sm">
				{m["exams.toeic.result.partsBreakdownTitle"]()}
			</h2>

			<div className="flex flex-col divide-y divide-border/60">
				{parts.map((p) => {
					const pct =
						p.totalQuestions > 0
							? Math.round((p.correctCount / p.totalQuestions) * 100)
							: 0;

					return (
						<div
							key={p.partNum}
							className="grid grid-cols-12 items-center gap-2 py-3.5 first:pt-0 last:pb-0 md:gap-4"
						>
							{/* Part Title and Description */}
							<div className="col-span-4 flex flex-col sm:col-span-3">
								<span className="text-sm font-bold text-foreground">
									{m["exams.toeic.result.review.part"]({ part: p.partNum })}
								</span>
								<span className="text-xs text-muted-foreground truncate">
									{p.name}
								</span>
							</div>

							{/* Progress Bar */}
							<div className="col-span-6 sm:col-span-7">
								<Progress value={pct} className="h-2.5 bg-muted" />
							</div>

							{/* Fraction */}
							<div className="col-span-2 text-right text-xs font-semibold text-foreground sm:text-sm">
								{p.correctCount}/{p.totalQuestions}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
