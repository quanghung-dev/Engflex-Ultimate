import { m } from "#/paraglide/messages";

export function VisualAnchor({
	coverImageUrl,
	caption,
}: {
	coverImageUrl: string;
	caption: string;
}) {
	return (
		<div className="relative h-full min-h-48 overflow-hidden rounded-xl border">
			{coverImageUrl ? (
				<img
					src={coverImageUrl}
					alt=""
					className="absolute inset-0 size-full object-cover grayscale"
				/>
			) : (
				<div className="absolute inset-0 bg-linear-to-br from-primary/20 via-accent-violet/10 to-ai-coral/10" />
			)}
			<div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent" />
			<div className="relative flex h-full flex-col justify-end gap-1 p-4">
				<span className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">
					{m["lessons.scenarioContext"]()}
				</span>
				<p className="text-sm font-semibold text-white">{caption}</p>
			</div>
		</div>
	);
}
