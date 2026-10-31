import { BookOpen, Headphones } from "lucide-react";
import { m } from "#/paraglide/messages";

export interface ToeicPartItem {
	partNumber: number;
	section: "listening" | "reading";
	type: string;
	questionsCount: number;
}

export function ToeicPartsBreakdown({ parts }: { parts: ToeicPartItem[] }) {
	return (
		<div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
			<div className="overflow-x-auto">
				<table className="w-full text-left text-xs md:text-sm">
					<thead>
						<tr className="border-b border-border/60 bg-muted/40 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
							<th scope="col" className="px-4 py-3 md:px-5">
								{m["exams.toeic.test.breakdown.section"]()}
							</th>
							<th scope="col" className="px-4 py-3 md:px-5">
								{m["exams.toeic.test.breakdown.part"]()}
							</th>
							<th scope="col" className="px-4 py-3 md:px-5">
								{m["exams.toeic.test.breakdown.type"]()}
							</th>
							<th scope="col" className="px-4 py-3 text-right md:px-5">
								{m["exams.toeic.test.breakdown.questions"]()}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/50 font-medium">
						{parts.map((part) => (
							<tr
								key={part.partNumber}
								className="transition-colors hover:bg-muted/30"
							>
								<td className="px-4 py-3.5 md:px-5">
									{part.section === "listening" ? (
										<span className="inline-flex items-center gap-1.5 rounded-md border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-600 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-400">
											<Headphones className="size-3.5" aria-hidden="true" />
											{m["exams.toeic.test.breakdown.listening"]()}
										</span>
									) : (
										<span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
											<BookOpen className="size-3.5" aria-hidden="true" />
											{m["exams.toeic.test.breakdown.reading"]()}
										</span>
									)}
								</td>
								<td className="px-4 py-3.5 font-bold text-foreground md:px-5">
									Part {part.partNumber}
								</td>
								<td className="px-4 py-3.5 text-muted-foreground md:px-5">
									{part.type}
								</td>
								<td className="px-4 py-3.5 text-right font-bold text-foreground md:px-5">
									{part.questionsCount}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
