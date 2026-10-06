import type { ReactNode } from "react";

/**
 * Shared page layout: content container + optional header (bare icon,
 * Quicksand title, description as peach bubble or muted subtitle) + body.
 * The icon is rendered as-is — pass a container-free `MoMascot`, never a
 * boxed tile.
 */
export function PageHero({
	icon,
	title,
	description,
}: {
	icon: ReactNode;
	title: string;
	description: ReactNode;
}) {
	return (
		<div className="flex items-center gap-4">
			<span className="inline-flex shrink-0">{icon}</span>
			<div className="min-w-0">
				<h1 className="text-[28px] leading-[36px] font-bold text-foreground md:text-[38px] md:leading-[46px]">
					{title}
				</h1>
				{description && (
					<p className="bubble bubble-own mt-2 w-fit text-[15px] font-bold">
						{description}
					</p>
				)}
			</div>
		</div>
	);
}

export interface PageHeroSpec {
	icon: ReactNode;
	title: string;
	description: ReactNode;
}

export function PageLayout({
	hero,
	children,
}: {
	hero?: PageHeroSpec | null;
	children?: ReactNode;
}) {
	return (
		<div className="container-content flex flex-col gap-6 py-8">
			{hero ? (
				<PageHero
					icon={hero.icon}
					title={hero.title}
					description={hero.description}
				/>
			) : null}
			{children}
		</div>
	);
}
