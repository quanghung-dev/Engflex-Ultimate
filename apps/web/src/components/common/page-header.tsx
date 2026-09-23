import type { ReactNode } from "react";

type PageHeaderProps = {
	title: string;
	subtitle?: string;
	action?: ReactNode;
};

/** Mock heading pattern: extrabold tracking-tight title + muted subtitle. */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0">
				<h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-foreground md:text-[32px]">
					{title}
				</h1>
				{subtitle ? (
					<p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
				) : null}
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}
