import { Volume2 } from "lucide-react";
import { m } from "#/paraglide/messages";
import { AudioPlayerBar } from "./audio-player-bar";

export function DialogueContextBox({
	title,
	prompt,
	durationMs,
}: {
	title: string;
	prompt: string;
	durationMs: number;
}) {
	return (
		<div className="surface-card flex flex-col gap-3 p-5">
			<span className="text-[11px] font-bold text-primary">
				{m["lessons.skill.dictation"]()}
			</span>
			<h2 className="text-xl font-bold text-foreground">{title}</h2>
			<p className="text-[15px] font-medium text-muted-foreground">
				{m["lessons.dictation.context"]()}: {prompt}
			</p>
			<div className="flex flex-col gap-2">
				<span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
					<Volume2 className="size-3.5" />
					{m["lessons.dictation.speakerB"]()}
				</span>
				<AudioPlayerBar durationMs={durationMs} />
			</div>
		</div>
	);
}
