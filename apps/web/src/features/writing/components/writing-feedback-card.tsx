import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { CircleCheck, Lightbulb, TriangleAlert } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { WritingFeedback } from "#/features/writing/types";
import { m } from "#/paraglide/messages";

const KIND_MESSAGES: Record<
	WritingFeedback["rows"][number]["kind"],
	() => string
> = {
	Grammar: () => m["lessons.writing.feedback.kind.grammar"](),
	Vocabulary: () => m["lessons.writing.feedback.kind.vocabulary"](),
	Naturalness: () => m["lessons.writing.feedback.kind.naturalness"](),
};

const TONE: Record<
	WritingFeedback["rows"][number]["tone"],
	{ icon: LucideIcon; circle: string }
> = {
	warning: { icon: TriangleAlert, circle: "bg-warning/15 text-warning" },
	accuracy: { icon: CircleCheck, circle: "bg-accuracy-tint text-accuracy" },
	violet: { icon: Lightbulb, circle: "bg-secondary text-accent-violet" },
};

export function WritingFeedbackCard({
	feedback,
	continueLabel,
	onContinue,
}: {
	feedback: WritingFeedback;
	continueLabel: string;
	onContinue: () => void;
}) {
	return (
		<div className="surface-card flex flex-col gap-4 p-5">
			<div className="flex flex-wrap items-center gap-2">
				<span className="text-[11px] font-bold text-muted-foreground">
					{m["lessons.writing.feedback.title"]()}
				</span>
				<span className="chip border-accuracy bg-accuracy-tint px-2 py-0 text-[11px] text-accuracy">
					{m["lessons.writing.feedback.cefr"]({ level: feedback.cefrLevel })}
				</span>
			</div>
			<ul className="flex flex-col gap-3">
				{feedback.rows.map((row) => {
					const tone = TONE[row.tone];
					const Icon = tone.icon;
					return (
						<li key={row.kind} className="flex items-start gap-3">
							<span className={cn("tile", tone.circle)}>
								<Icon className="size-4" />
							</span>
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-bold text-foreground">
									{KIND_MESSAGES[row.kind]()}
								</span>
								<span className="text-[15px] font-medium text-muted-foreground">
									{row.body}
								</span>
							</div>
						</li>
					);
				})}
			</ul>
			<div className="flex justify-end">
				<Button type="button" className="btn btn-primary" onClick={onContinue}>
					{continueLabel}
				</Button>
			</div>
		</div>
	);
}
