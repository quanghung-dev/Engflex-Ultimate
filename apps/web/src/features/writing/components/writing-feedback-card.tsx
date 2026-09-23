import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { CircleCheck, Lightbulb, TriangleAlert } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { WritingFeedback } from "#/features/writing/types";
import { m } from "#/paraglide/messages";

const KIND_MESSAGES: Record<
	WritingFeedback["rows"][number]["kind"],
	() => string
> = {
	Grammar: () => m["lessons.feedbackKind.grammar"](),
	Vocabulary: () => m["lessons.feedbackKind.vocabulary"](),
	Naturalness: () => m["lessons.feedbackKind.naturalness"](),
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
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
			<div className="flex items-center gap-2">
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{m["lessons.feedbackTitle"]()}
				</span>
				<Badge className="bg-accuracy-tint text-accuracy" variant="secondary">
					{m["lessons.feedbackCefr"]({ level: feedback.cefrLevel })}
				</Badge>
			</div>
			<ul className="flex flex-col gap-3">
				{feedback.rows.map((row) => {
					const tone = TONE[row.tone];
					const Icon = tone.icon;
					return (
						<li key={row.kind} className="flex items-start gap-3">
							<span
								className={cn(
									"flex size-8 shrink-0 items-center justify-center rounded-full",
									tone.circle,
								)}
							>
								<Icon className="size-4" />
							</span>
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-semibold text-foreground">
									{KIND_MESSAGES[row.kind]()}
								</span>
								<span className="text-xs text-muted-foreground">
									{row.body}
								</span>
							</div>
						</li>
					);
				})}
			</ul>
			<div className="flex justify-end border-t pt-4">
				<Button type="button" onClick={onContinue}>
					{continueLabel}
				</Button>
			</div>
		</div>
	);
}
