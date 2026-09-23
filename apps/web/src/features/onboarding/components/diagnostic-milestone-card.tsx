import { m } from "#/paraglide/messages";

const AXES = [
	{
		key: "precision",
		label: () => m["onboarding.diagnostic.axes.precision"](),
		value: 88,
	},
	{
		key: "lexical",
		label: () => m["onboarding.diagnostic.axes.lexical"](),
		value: 76,
	},
	{
		key: "cadence",
		label: () => m["onboarding.diagnostic.axes.cadence"](),
		value: 84,
	},
	{
		key: "stress",
		label: () => m["onboarding.diagnostic.axes.stress"](),
		value: 82,
	},
	{
		key: "latency",
		label: () => m["onboarding.diagnostic.axes.latency"](),
		value: 70,
	},
	{
		key: "clarity",
		label: () => m["onboarding.diagnostic.axes.clarity"](),
		value: 92,
	},
] as const;

const CENTER = 110;
const RADIUS = 76;

function point(index: number, ratio: number): [number, number] {
	const angle = (Math.PI * 2 * index) / AXES.length - Math.PI / 2;
	return [
		CENTER + Math.cos(angle) * RADIUS * ratio,
		CENTER + Math.sin(angle) * RADIUS * ratio,
	];
}

const polygon = AXES.map((axis, index) => point(index, axis.value / 100))
	.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
	.join(" ");

export function DiagnosticMilestoneCard() {
	return (
		<div className="flex flex-col gap-4 p-5">
			<div>
				<p className="text-sm font-semibold text-foreground">
					{m["onboarding.diagnostic.percentile"]()}
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					{m["onboarding.diagnostic.acceleration"]()}
				</p>
			</div>
			<div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<svg
					viewBox="0 0 220 220"
					className="h-52 w-52 shrink-0"
					role="img"
					aria-label={m["onboarding.diagnostic.chartLabel"]()}
				>
					{[0.33, 0.66, 1].map((ratio) => (
						<polygon
							key={ratio}
							points={AXES.map((_, index) =>
								point(index, ratio)
									.map((n) => n.toFixed(1))
									.join(","),
							).join(" ")}
							className="fill-none stroke-border"
							strokeWidth="1"
						/>
					))}
					{AXES.map((axis, index) => {
						const [x, y] = point(index, 1);
						return (
							<line
								key={axis.key}
								x1={CENTER}
								y1={CENTER}
								x2={x}
								y2={y}
								className="stroke-border"
								strokeWidth="1"
							/>
						);
					})}
					<polygon
						points={polygon}
						className="fill-primary/10 stroke-primary"
						strokeWidth="2"
					/>
					{AXES.map((axis, index) => {
						const [x, y] = point(index, 1.16);
						return (
							<text
								key={axis.key}
								x={x}
								y={y}
								textAnchor="middle"
								dominantBaseline="middle"
								className="fill-muted-foreground text-[9px] font-semibold tracking-wide"
							>
								{axis.label()} ({axis.value}%)
							</text>
						);
					})}
				</svg>
				<dl className="grid grid-cols-1 gap-3 sm:grid-cols-1">
					{[
						{
							label: () => m["onboarding.diagnostic.baseline"](),
							value: "86/100",
						},
						{
							label: () => m["onboarding.diagnostic.latency"](),
							value: "180ms",
						},
						{
							label: () => m["onboarding.diagnostic.clarity"](),
							value: "94.2%",
						},
					].map((stat) => (
						<div
							key={stat.label()}
							className="rounded-xl border bg-card px-4 py-3"
						>
							<dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
								{stat.label()}
							</dt>
							<dd className="text-xl font-extrabold tracking-tight text-foreground">
								{stat.value}
							</dd>
						</div>
					))}
				</dl>
			</div>
		</div>
	);
}
