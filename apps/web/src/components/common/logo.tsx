import { cn } from "cn";

type LogoProps = {
	variant?: "full" | "mark";
	className?: string;
};

/** Brand mark from the mock: 5 rounded bars + Manrope wordmark, no dot. */
export function Logo({ variant = "full", className }: LogoProps) {
	return (
		<span className={cn("inline-flex items-center gap-2", className)}>
			<svg
				viewBox="0 0 54 56"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				className="h-6 w-6 shrink-0"
			>
				<rect x="0" y="8" width="6" height="40" rx="3" fill="var(--primary)" />
				<rect
					x="12"
					y="16"
					width="6"
					height="24"
					rx="3"
					fill="var(--primary)"
				/>
				<rect x="24" y="0" width="6" height="56" rx="3" fill="var(--primary)" />
				<rect
					x="36"
					y="12"
					width="6"
					height="32"
					rx="3"
					fill="var(--accent-violet)"
				/>
				<rect
					x="48"
					y="20"
					width="6"
					height="16"
					rx="3"
					fill="var(--primary)"
				/>
			</svg>
			{variant === "full" ? (
				<span className="text-[20px] leading-none font-extrabold tracking-[-0.03em] text-foreground">
					engflex
				</span>
			) : null}
		</span>
	);
}
