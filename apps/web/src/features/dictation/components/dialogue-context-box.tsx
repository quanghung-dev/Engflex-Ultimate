import { Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import { m } from "#/paraglide/messages";

export function DialogueContextBox({
	prompt,
	children,
}: {
	prompt: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
			<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
				{m["lessons.dialogueContext"]()}
			</span>
			<div className="flex flex-col gap-1">
				<span className="text-xs font-semibold text-muted-foreground">
					{m["lessons.speakerA"]()}
				</span>
				<p className="text-sm font-medium text-foreground">“{prompt}”</p>
			</div>
			<div className="flex flex-col gap-2 rounded-lg border bg-background p-3">
				<span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
					<Volume2 className="size-3.5" />
					{m["lessons.speakerB"]()}
				</span>
				<span className="text-[11px] text-muted-foreground">
					{m["lessons.audioPlaceholder"]()}
				</span>
				{children}
			</div>
		</div>
	);
}
