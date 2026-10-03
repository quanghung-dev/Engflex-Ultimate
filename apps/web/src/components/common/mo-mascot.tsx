import { cn } from "cn";
import type { ReactNode } from "react";

/**
 * Mo the sloth. The face is fixed; only eyes, mouth, brows, arms and small
 * props change per variant. Everything is plain SVG (no filters, no images).
 *
 *   <MoMascot variant="cheer" size={96} />
 *   <MoMascot variant="listening" label="Mo is listening" />
 *   <MoInBubble size={44} />
 */
export type MoVariant =
	| "rest" // default, calm
	| "nice" // content, soft smile
	| "wave" // greetings, onboarding
	| "open" // welcome, empty states
	| "cheer" // activity completed
	| "win" // achievement, level up
	| "heart" // saved, favorite, thanks
	| "thumbsup" // correct answer
	| "sad" // wrong answer, streak lost
	| "cry" // error, failed upload
	| "sleepy" // streak at risk, idle
	| "thinking" // loading, AI is working
	| "confused" // no results, unclear input
	| "surprised" // new badge, surprise
	| "listening" // voice mode, mic on
	| "talk" // voice mode, Mo speaking
	| "headphones"; // dictation, shadowing

export const MO_VARIANTS: MoVariant[] = [
	"rest",
	"nice",
	"wave",
	"open",
	"cheer",
	"win",
	"heart",
	"thumbsup",
	"sad",
	"cry",
	"sleepy",
	"thinking",
	"confused",
	"surprised",
	"listening",
	"talk",
	"headphones",
];

const BROWN = "#583A1F";
const BROW = "#3A2412";
const INK = "#1D1342";
const CREAM = "#F8EBD3";
const PURPLE = "#6C4DF0";
const GOLD = "#FFC857";
const TEAR = "#8EC5FF";
const PINK = "#FF6B8A";

const stroke = (w: number, c: string) =>
	({
		fill: "none",
		stroke: c,
		strokeWidth: w,
		strokeLinecap: "round",
		strokeLinejoin: "round",
	}) as const;

type EyeKind = "open" | "up" | "side" | "wide" | "happy" | "closed" | "half";
type EyesKind = EyeKind | "wink";
type MouthKind =
	| "smile"
	| "soft"
	| "sad"
	| "wavy"
	| "grin"
	| "wail"
	| "o"
	| "talk"
	| "tiny";
type BrowKind = "worried" | "angry" | "raised" | "confused";

interface Cfg {
	eyes?: EyesKind;
	mouth?: MouthKind;
	brows?: BrowKind;
	blush?: boolean;
	tilt?: number;
	behind?: ReactNode; // drawn behind the head (arms, props)
	front?: ReactNode; // drawn over the head (hands, headphones)
}

/* ---------- small parts ---------- */

const Arm = ({ d }: { d: string }) => <path d={d} {...stroke(5.5, BROWN)} />;
const Hand = ({ x, y, r = 4.5 }: { x: number; y: number; r?: number }) => (
	<circle cx={x} cy={y} r={r} fill={BROWN} />
);
const Heart = ({
	x,
	y,
	s,
	c = PINK,
}: {
	x: number;
	y: number;
	s: number;
	c?: string;
}) => (
	<path
		transform={`translate(${x} ${y}) scale(${s})`}
		d="M0 4C-8-2-4-9 0-5C4-9 8-2 0 4Z"
		fill={c}
	/>
);
const Sparkle = ({ x, y, r }: { x: number; y: number; r: number }) => (
	<path
		d={`M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`}
		fill={GOLD}
	/>
);
const Waves = ({ d }: { d: string[] }) => (
	<g {...stroke(2.4, PURPLE)}>
		{d.map((p) => (
			<path key={p} d={p} />
		))}
	</g>
);

function Eye({ x, kind }: { x: number; kind: EyeKind }) {
	switch (kind) {
		case "happy":
			return (
				<path
					d={`M${x - 5} 49.5Q${x} 42 ${x + 5} 49.5`}
					{...stroke(2.8, CREAM)}
				/>
			);
		case "closed":
			return (
				<path d={`M${x - 5} 47Q${x} 52 ${x + 5} 47`} {...stroke(2.8, CREAM)} />
			);
		case "wide":
			return (
				<>
					<circle cx={x} cy={48} r={6.5} fill={CREAM} />
					<circle cx={x} cy={48} r={3.6} fill={INK} />
					<circle cx={x - 1.2} cy={46.6} r={1.2} fill="#fff" />
				</>
			);
		case "half":
			return (
				<>
					<circle cx={x} cy={48} r={4.5} fill={INK} />
					<rect x={x - 5.5} y={41} width={11} height={7} fill={BROWN} />
					<path d={`M${x - 5} 48H${x + 5}`} {...stroke(2.2, CREAM)} />
				</>
			);
		default: {
			const dx = kind === "side" ? 2.5 : kind === "up" ? 2 : 0;
			const dy = kind === "up" ? -2.5 : 0;
			return (
				<>
					<circle cx={x + dx} cy={48 + dy} r={4.5} fill={INK} />
					<circle cx={x - 1.5 + dx} cy={46 + dy} r={1.5} fill="#fff" />
				</>
			);
		}
	}
}

function Eyes({ kind }: { kind: EyesKind }) {
	const l: EyeKind = kind === "wink" ? "open" : kind;
	const r: EyeKind = kind === "wink" ? "happy" : kind;
	return (
		<>
			<Eye x={36} kind={l} />
			<Eye x={64} kind={r} />
		</>
	);
}

function Mouth({ kind }: { kind: MouthKind }) {
	const line = (d: string) => <path d={d} {...stroke(2.5, INK)} />;
	switch (kind) {
		case "soft":
			return line("M45 65.5C48 66.5 52 66.5 55 65.5");
		case "sad":
			return line("M44 69C47 65 53 65 56 69");
		case "wavy":
			return line("M43 67Q46.5 63 50 67T57 67");
		case "grin":
			return (
				<>
					<path d="M42 64C44 76 56 76 58 64Z" fill={INK} />
					<ellipse cx={50} cy={71.2} rx={3.6} ry={1.8} fill="#F26D7D" />
				</>
			);
		case "wail":
			return <path d="M43 72C45 63 55 63 57 72Z" fill={INK} />;
		case "o":
			return <ellipse cx={50} cy={67} rx={3.5} ry={4.5} fill={INK} />;
		case "talk":
			return <ellipse cx={50} cy={67.5} rx={4.5} ry={3.2} fill={INK} />;
		case "tiny":
			return <ellipse cx={50} cy={66.5} rx={2.5} ry={3} fill={INK} />;
		default:
			return line("M44 65C47 68 53 68 56 65");
	}
}

function Brows({ kind }: { kind: BrowKind }) {
	const d: Record<BrowKind, string[]> = {
		worried: ["M28 35L42 29", "M72 35L58 29"],
		angry: ["M28 29L42 35", "M72 29L58 35"],
		raised: ["M30 31Q36 25 42 31", "M58 31Q64 25 70 31"],
		confused: ["M29 33L42 31", "M58 29Q64 25 71 29"],
	};
	return (
		<g {...stroke(3, BROW)}>
			{d[kind].map((p) => (
				<path key={p} d={p} />
			))}
		</g>
	);
}

/* ---------- face (unchanged design) ---------- */

function Face({ eyes = "open", mouth = "smile", brows, blush, tilt = 0 }: Cfg) {
	return (
		<g transform={tilt ? `rotate(${tilt} 50 55)` : undefined}>
			<ellipse cx="50" cy="50" rx="42" ry="38" fill="#966F47" />
			<ellipse cx="50" cy="52" rx="33" ry="28" fill="#E8D7B8" />
			<ellipse
				cx="36"
				cy="48"
				rx="10"
				ry="14"
				transform="rotate(-12 36 48)"
				fill={BROWN}
			/>
			<ellipse
				cx="64"
				cy="48"
				rx="10"
				ry="14"
				transform="rotate(12 64 48)"
				fill={BROWN}
			/>
			{blush && (
				<g fill="#F4A0A0" opacity=".75">
					<ellipse cx="26" cy="61" rx="5" ry="3" />
					<ellipse cx="74" cy="61" rx="5" ry="3" />
				</g>
			)}
			<Eyes kind={eyes} />
			<ellipse cx="50" cy="58" rx="5" ry="3.5" fill={INK} />
			{brows && <Brows kind={brows} />}
			<Mouth kind={mouth} />
		</g>
	);
}

/* ---------- variants ---------- */

const Trophy = (
	<g transform="translate(50 -2)">
		<path d="M-9-10H9V-2C9 4 4 7 0 7C-4 7-9 4-9-2Z" fill={GOLD} />
		<path d="M-9-8C-15-8-15 0-8 1M9-8C15-8 15 0 8 1" {...stroke(2.5, GOLD)} />
		<rect x={-1.5} y={7} width={3} height={4} fill={GOLD} />
		<rect x={-6} y={11} width={12} height={3} rx={1.5} fill="#E0A93B" />
	</g>
);

const VARIANTS: Record<MoVariant, Cfg> = {
	rest: {},
	nice: { eyes: "happy", mouth: "soft", blush: true },
	wave: {
		mouth: "smile",
		behind: (
			<>
				<Arm d="M90 60C98 54 100 42 97 30" />
				<Hand x={97} y={28} />
				<Waves d={["M104 22q3 3 1 7", "M103 14q6 5 3 14"]} />
			</>
		),
	},
	open: {
		behind: (
			<>
				<Arm d="M10 66C2 66-3 60-5 52" />
				<Arm d="M90 66C98 66 103 60 105 52" />
				<Hand x={-5} y={52} />
				<Hand x={105} y={52} />
			</>
		),
	},
	cheer: {
		eyes: "happy",
		mouth: "grin",
		behind: (
			<>
				<Arm d="M10 58C2 50-1 38 2 26" />
				<Arm d="M90 58C98 50 101 38 98 26" />
				<Hand x={2} y={25} />
				<Hand x={98} y={25} />
				<Sparkle x={-2} y={6} r={5} />
				<Sparkle x={104} y={6} r={5} />
				<Sparkle x={50} y={-8} r={4} />
			</>
		),
	},
	win: {
		eyes: "happy",
		mouth: "grin",
		behind: (
			<>
				{Trophy}
				<Arm d="M10 56C-2 40 10 14 41 7" />
				<Arm d="M90 56C102 40 90 14 59 7" />
				<Hand x={41} y={7} />
				<Hand x={59} y={7} />
				<Sparkle x={12} y={0} r={4} />
				<Sparkle x={88} y={0} r={4} />
			</>
		),
	},
	heart: {
		eyes: "happy",
		blush: true,
		behind: (
			<>
				<Heart x={20} y={2} s={1.1} />
				<Heart x={50} y={-8} s={1.5} />
				<Heart x={80} y={2} s={1.1} />
			</>
		),
	},
	thumbsup: {
		eyes: "wink",
		mouth: "grin",
		behind: (
			<>
				<Arm d="M90 62C99 60 103 52 101 42" />
				<Hand x={101} y={41} r={5.5} />
				<path d="M101 36V28" {...stroke(4.5, BROWN)} />
			</>
		),
	},
	sad: {
		brows: "worried",
		mouth: "sad",
		front: <path d="M29 58C26 63 26 67 29 68C32 67 32 63 29 58Z" fill={TEAR} />,
	},
	cry: {
		eyes: "closed",
		brows: "worried",
		mouth: "wail",
		front: (
			<g {...stroke(3, TEAR)}>
				<path d="M33 56C30 64 30 70 31 74" />
				<path d="M67 56C70 64 70 70 69 74" />
			</g>
		),
	},
	sleepy: {
		eyes: "half",
		mouth: "tiny",
		tilt: -5,
		behind: (
			<g {...stroke(2.4, PURPLE)}>
				<path d="M78 6h8l-8 9h8" />
				<path d="M90-6h6l-6 7h6" />
			</g>
		),
	},
	thinking: {
		eyes: "up",
		brows: "confused",
		mouth: "soft",
		tilt: -4,
		behind: (
			<g fill={PURPLE}>
				<circle cx={82} cy={8} r={2} />
				<circle cx={90} cy={0} r={3} />
				<circle cx={99} cy={-9} r={4.2} />
			</g>
		),
		front: (
			<>
				<path d="M91 72C98 92 74 98 62 83" {...stroke(5.5, BROWN)} />
				<Hand x={61} y={82} r={5} />
			</>
		),
	},
	confused: {
		brows: "confused",
		mouth: "wavy",
		tilt: 5,
		behind: (
			<>
				<path
					d="M84 0C84-9 98-9 98-2C98 3 91 3 91 9"
					{...stroke(3.5, PURPLE)}
				/>
				<circle cx={91} cy={15} r={2.2} fill={PURPLE} />
			</>
		),
	},
	surprised: {
		eyes: "wide",
		brows: "raised",
		mouth: "o",
		behind: (
			<g {...stroke(2.5, GOLD)}>
				<path d="M50-6V2" />
				<path d="M30-2l3 6" />
				<path d="M70-2l-3 6" />
			</g>
		),
	},
	listening: {
		eyes: "side",
		mouth: "soft",
		behind: (
			<>
				<Arm d="M91 66C100 60 101 46 95 38" />
				<Hand x={94} y={36} r={6} />
				<Waves d={["M101 20q5 5 0 11", "M105 13q9 11 0 25"]} />
			</>
		),
	},
	talk: {
		mouth: "talk",
		behind: <Waves d={["M97 54q5 6 0 12", "M102 49q9 11 0 22"]} />,
	},
	headphones: {
		mouth: "soft",
		behind: (
			<g fill={PURPLE}>
				<circle cx={99} cy={14} r={3} />
				<path d="M102 14V2q4 0 5 4" {...stroke(2, PURPLE)} />
			</g>
		),
		front: (
			<>
				<path d="M13 46C11 4 89 4 87 46" {...stroke(5, "#2A2150")} />
				<rect x={5} y={38} width={11} height={22} rx={5} fill={PURPLE} />
				<rect x={84} y={38} width={11} height={22} rx={5} fill={PURPLE} />
			</>
		),
	},
};

/* ---------- public components ---------- */

export function MoMascot({
	variant = "rest",
	size = 64,
	label,
	className,
}: {
	variant?: MoVariant;
	size?: number;
	/** Accessible name. Omit for purely decorative use. */
	label?: string;
	className?: string;
}) {
	const cfg = VARIANTS[variant];
	return (
		<span
			className={cn("inline-flex shrink-0", className)}
			style={{ width: size, height: size }}
		>
			<svg
				viewBox="-8 -16 116 116"
				overflow="visible"
				fill="none"
				className="h-full w-full"
				role={label ? "img" : undefined}
				aria-label={label}
				aria-hidden={label ? undefined : true}
			>
				{cfg.behind}
				<Face {...cfg} />
				{cfg.front}
			</svg>
		</span>
	);
}

const BUBBLE =
	"M30 8h60a22 22 0 0 1 22 22v36a22 22 0 0 1-22 22H52l-20 16v-16h-2A22 22 0 0 1 8 66V30A22 22 0 0 1 30 8z";

/** Brand mark: Mo inside a speech bubble (same shape as the logo). */
export function MoInBubble({
	size = 44,
	variant = "rest",
	className,
}: {
	size?: number;
	variant?: MoVariant;
	className?: string;
}) {
	const { behind: _b, front: _f, ...face } = VARIANTS[variant];
	return (
		<span
			className={cn("inline-flex shrink-0", className)}
			style={{ width: size, height: (size * 116) / 120 }}
		>
			<svg
				viewBox="0 0 120 116"
				fill="none"
				aria-hidden="true"
				className="h-full w-full"
			>
				<path
					d={BUBBLE}
					transform="translate(0 4)"
					style={{
						fill: "color-mix(in srgb, var(--color-primary, #6C4DF0) 62%, #000)",
					}}
				/>
				<path d={BUBBLE} style={{ fill: "var(--color-primary, #6C4DF0)" }} />
				<g transform="translate(16 6) scale(.88)">
					<Face {...face} />
				</g>
			</svg>
		</span>
	);
}
