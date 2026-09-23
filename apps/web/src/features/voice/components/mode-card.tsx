import { ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { ModeCard as ModeCardFixture } from "#/features/voice/fixtures";
import { m } from "#/paraglide/messages";

const MODE_COPY: Record<
	ModeCardFixture["id"],
	{
		badge: () => string;
		title: () => string;
		description: () => string;
		meta: () => string;
		features: Array<() => string>;
		cta: () => string;
	}
> = {
	spontaneous: {
		badge: () => m["voice.modes.spontaneous.badge"](),
		title: () => m["voice.modes.spontaneous.title"](),
		description: () => m["voice.modes.spontaneous.description"](),
		meta: () => m["voice.modes.spontaneous.meta"](),
		features: [
			() => m["voice.modes.spontaneous.feature0"](),
			() => m["voice.modes.spontaneous.feature1"](),
			() => m["voice.modes.spontaneous.feature2"](),
		],
		cta: () => m["voice.modes.spontaneous.cta"](),
	},
	structured: {
		badge: () => m["voice.modes.structured.badge"](),
		title: () => m["voice.modes.structured.title"](),
		description: () => m["voice.modes.structured.description"](),
		meta: () => m["voice.modes.structured.meta"](),
		features: [
			() => m["voice.modes.structured.feature0"](),
			() => m["voice.modes.structured.feature1"](),
			() => m["voice.modes.structured.feature2"](),
		],
		cta: () => m["voice.modes.structured.cta"](),
	},
};

export function ModeCard({
	card,
	onStart,
}: {
	card: ModeCardFixture;
	onStart: () => void;
}) {
	const Icon = card.icon;
	const MetaIcon = card.metaIcon;
	const copy = MODE_COPY[card.id];

	return (
		<div className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5">
			<span className="w-fit rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
				{copy.badge()}
			</span>
			<div className="flex items-center gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
					<Icon className="size-5" />
				</span>
				<h2 className="text-base font-bold tracking-tight text-foreground">
					{copy.title()}
				</h2>
			</div>
			<p className="text-sm text-muted-foreground">{copy.description()}</p>
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<MetaIcon className="size-3.5" />
				{copy.meta()}
			</div>
			<ul className="flex flex-col gap-2">
				{copy.features.map((feature, index) => (
					<li
						key={index}
						className="flex items-start gap-2 text-xs text-muted-foreground"
					>
						<CircleCheck className="mt-0.5 size-3.5 shrink-0 text-accuracy" />
						{feature()}
					</li>
				))}
			</ul>
			<Button type="button" className="mt-auto w-full" onClick={onStart}>
				{copy.cta()}
				<ArrowRight data-icon="inline-end" />
			</Button>
		</div>
	);
}
