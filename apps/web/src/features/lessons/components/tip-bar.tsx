import { Lightbulb } from "lucide-react";
import { m } from "#/paraglide/messages";

export function TipBar({ tip }: { tip: string }) {
	return (
		<div className="flex items-start gap-3 rounded-xl border border-accent-violet/30 bg-secondary p-4">
			<Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-violet" />
			<p className="text-xs text-muted-foreground">
				<span className="font-semibold text-foreground">
					{m["lessons.tipPrefix"]()}
				</span>
				{tip}
			</p>
		</div>
	);
}
