import { Link } from "@tanstack/react-router";
import { Fragment } from "react";
import type { CrumbItem } from "#/app/breadcrumbs";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";

export function PageCrumbs({
	items,
	className,
}: {
	items: CrumbItem[];
	className?: string;
}) {
	if (items.length === 0) return null;
	return (
		<Breadcrumb className={className}>
			<BreadcrumbList>
				{items.map((item, index) => (
					<Fragment key={`${item.to ?? ""}:${item.label}`}>
						{index > 0 ? (
							<BreadcrumbSeparator className="hidden opacity-50 md:block" />
						) : null}
						<BreadcrumbItem
							className={
								index === 0 && items.length > 1 ? "hidden md:block" : undefined
							}
						>
							{item.to && index < items.length - 1 ? (
								<BreadcrumbLink
									asChild
									className="font-medium opacity-80 hover:text-foreground hover:opacity-100"
								>
									<Link to={item.to} params={item.params}>
										{item.label}
									</Link>
								</BreadcrumbLink>
							) : (
								<BreadcrumbPage className="font-semibold">
									{item.label}
								</BreadcrumbPage>
							)}
						</BreadcrumbItem>
					</Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
