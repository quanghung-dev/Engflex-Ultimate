import type { VocabularyItem } from "@engflex/contracts";
import { cn } from "cn";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AudioButton } from "#/components/common/audio-button";
import { CefrBadge } from "#/components/common/cefr-badge";
import { SourcePill } from "#/components/common/source-pill";
import { Button } from "#/components/ui/button";
import { toggleMastered } from "#/features/vocabulary/store";
import { m } from "#/paraglide/messages";

export function WordHeroCard({ item }: { item: VocabularyItem }) {
	const state = item.userState;
	const mastered = state?.mastered ?? false;

	async function copy(value: string, message: string) {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(message);
		} catch {
			toast.error(m["common.clipboardUnavailable"]());
		}
	}

	return (
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
			<div className="flex flex-wrap items-center gap-2">
				<h1 className="text-2xl font-extrabold tracking-tight text-foreground">
					{item.term}
				</h1>
				<CefrBadge value={item.cefr} />
				<span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
					{item.partOfSpeech}
				</span>
				{state ? (
					<SourcePill source={state.sourceType} suffix={state.sourceId} />
				) : null}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<span className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
					{item.ipa}
				</span>
				<AudioButton label={m["common.listenUS"]()} />
				<AudioButton label={m["common.listenUK"]()} />
			</div>

			<p className="text-sm text-muted-foreground">{item.definition}</p>

			<div className="flex flex-wrap items-center gap-2 border-t pt-4">
				<Button
					type="button"
					variant={mastered ? "outline" : "default"}
					onClick={() => toggleMastered(item.id)}
					className={cn(mastered && "text-accuracy")}
				>
					<Check data-icon="inline-start" />
					{mastered
						? m["vocabulary.card.mastered"]()
						: m["vocabulary.card.markAsMastered"]()}
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={() =>
						copy(
							`${item.term} — ${item.definition}`,
							m["common.copiedClipboard"](),
						)
					}
				>
					<Copy data-icon="inline-start" />
					{m["vocabulary.card.copy"]()}
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={() => copy(window.location.href, m["common.linkCopied"]())}
				>
					<Share2 data-icon="inline-start" />
					{m["vocabulary.card.share"]()}
				</Button>
			</div>
		</div>
	);
}
