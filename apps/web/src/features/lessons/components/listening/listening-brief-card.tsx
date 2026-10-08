import { m } from "#/paraglide/messages";
import { AudioPlayer } from "./audio-player";

/** Listening brief: activity context + player; transcript unlocks on check. */
export function ListeningBriefCard({
	title,
	description,
	audioUrl,
	transcript,
	revealed,
}: {
	title: string;
	description: string;
	audioUrl: string;
	transcript: string;
	revealed: boolean;
}) {
	return (
		<div className="surface-card flex flex-col gap-3 p-5">
			<span className="text-[11px] font-bold text-primary">
				{m["lessons.listening.title"]()}
			</span>
			<h2 className="text-xl font-bold text-foreground">{title}</h2>
			<p className="text-[15px] font-medium text-muted-foreground">
				{m["lessons.listening.context"]()}: {description}
			</p>
			<AudioPlayer src={audioUrl} />
			{revealed ? (
				<div className="flex flex-col gap-1">
					<span className="text-xs font-bold text-muted-foreground">
						{m["lessons.listening.transcript"]()}
					</span>
					<p className="text-[15px] font-medium text-foreground">
						“{transcript}”
					</p>
				</div>
			) : null}
		</div>
	);
}
