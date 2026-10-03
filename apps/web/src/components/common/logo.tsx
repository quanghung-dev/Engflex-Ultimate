import { cn } from "cn";
import { MoInBubble } from "#/components/common/mo-mascot";

type LogoProps = {
	variant?: "full" | "mark";
	className?: string;
};

/** Brand lockup: Mo in purple bubble + Fredoka wordmark (eng inherits, flex apricot). */
export function Logo({ variant = "full", className }: LogoProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-2 text-foreground",
				className,
			)}
		>
			<MoInBubble size={36} />
			{variant === "full" ? (
				<span
					className="text-[20px] leading-none font-bold"
					style={{ fontFamily: "var(--font-display)" }}
				>
					eng<span style={{ color: "var(--secondary)" }}>flex</span>
				</span>
			) : null}
		</span>
	);
}
