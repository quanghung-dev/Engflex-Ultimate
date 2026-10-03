import { MoMascot } from "#/components/common/mo-mascot";
import { m } from "#/paraglide/messages";

export function TipBar({ tip }: { tip: string }) {
	return (
		<div
			className="flex items-center gap-3 p-4"
			style={{
				background: "#ffe2c5",
				border: "2px solid var(--border)",
				borderRadius: 24,
				boxShadow: "0 5px 0 var(--border)",
			}}
		>
			<MoMascot variant="nice" size={40} className="hidden sm:inline-flex" />
			<div className="min-w-0">
				<p className="text-[11px] font-bold tracking-wide text-foreground">
					{m["lessons.detail.calmTip"]()}
				</p>
				<p className="text-[15px] font-bold text-foreground">“{tip}”</p>
			</div>
		</div>
	);
}
