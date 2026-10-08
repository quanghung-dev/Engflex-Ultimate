import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

/** Post-submit reveal: the model answer plus a self-check checklist. */
export function ModelAnswerCard({
	modelAnswer,
	checklist,
	continueLabel,
	onContinue,
}: {
	modelAnswer: string;
	checklist: string[];
	continueLabel: string;
	onContinue: () => void;
}) {
	return (
		<div className="surface-card flex flex-col gap-4 p-5">
			<span className="text-[11px] font-bold text-muted-foreground">
				{m["lessons.writing.model.title"]()}
			</span>
			<p className="text-[15px] leading-[24px] font-medium text-foreground">
				{modelAnswer}
			</p>
			<div className="flex flex-col gap-2 rounded-[16px] border-2 border-border bg-accent p-3">
				<span className="text-xs font-bold text-muted-foreground">
					{m["lessons.writing.model.checklist"]()}
				</span>
				<ul className="flex flex-col gap-1.5">
					{checklist.map((item) => (
						<li
							key={item}
							className="flex items-start gap-2 text-[15px] font-medium text-foreground"
						>
							<span
								aria-hidden="true"
								className="mt-[9px] size-1.5 shrink-0 rounded-full bg-primary"
							/>
							{item}
						</li>
					))}
				</ul>
			</div>
			<div className="flex justify-end">
				<Button type="button" className="btn btn-primary" onClick={onContinue}>
					{continueLabel}
				</Button>
			</div>
		</div>
	);
}
