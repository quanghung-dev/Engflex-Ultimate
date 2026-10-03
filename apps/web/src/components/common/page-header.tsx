import type { ReactNode } from "react";

type PageHeaderProps = {
	title: string;
	subtitle?: string;
	action?: ReactNode;
};

/** Chunky heading pattern: Quicksand 700 title + 15px muted subtitle. */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0">
				<h1 className="text-[28px] leading-[36px] font-bold text-foreground md:text-[38px] md:leading-[46px]">
					{title}
				</h1>
				{subtitle ? (
					<p className="mt-1 text-[15px] leading-[22px] font-medium text-muted-foreground">
						{subtitle}
					</p>
				) : null}
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}
