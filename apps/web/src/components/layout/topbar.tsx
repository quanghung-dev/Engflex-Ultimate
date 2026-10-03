import { Link, useRouterState } from "@tanstack/react-router";
import { Fragment, type ReactNode } from "react";
import { APP_ROUTES } from "#/app/app-route";
import {
	crumbLabel,
	type ResolvedTarget,
	type RouteParams,
	readBreadcrumb,
	resolveTarget,
} from "#/app/breadcrumbs";
import { LocaleSwitcher } from "#/components/layout/locale-switcher";
import { ThemeToggle } from "#/components/ThemeToggle";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { Separator } from "#/components/ui/separator";
import { SidebarTrigger } from "#/components/ui/sidebar";

/**
 * Breadcrumbs come from the router's own match chain: every route declares its
 * `staticData.breadcrumb`, and non-final crumbs link to the target declared on
 * the crumb. Neither route ids nor paths are hardcoded here.
 */
export function Topbar() {
	const crumbs = useRouterState({
		select: (state) =>
			state.matches.flatMap((match) => {
				const meta = readBreadcrumb(match.staticData);
				if (!meta) return [];
				const specs = Array.isArray(meta) ? meta : [meta];
				const params = match.params as RouteParams;
				return specs.map((spec, index) => {
					const withTarget = typeof spec === "object" ? spec : { label: spec };
					return {
						key: `${match.routeId}:${index}`,
						text: crumbLabel(withTarget.label, params),
						target: resolveTarget(
							"target" in withTarget ? withTarget.target : undefined,
							params,
						),
					};
				});
			}),
	});

	return (
		<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4 text-foreground">
			<SidebarTrigger className="-ml-1" />
			<Separator
				orientation="vertical"
				className="mr-2 data-[orientation=vertical]:h-4"
			/>
			<Breadcrumb>
				<BreadcrumbList>
					{crumbs.map((crumb, index) => (
						<Fragment key={crumb.key}>
							{index > 0 ? (
								<BreadcrumbSeparator className="hidden opacity-50 md:block" />
							) : null}
							<BreadcrumbItem
								className={
									index === 0 && crumbs.length > 1
										? "hidden md:block"
										: undefined
								}
							>
								{crumb.target && index < crumbs.length - 1 ? (
									<BreadcrumbLink
										asChild
										className="font-medium opacity-80 hover:text-foreground hover:opacity-100"
									>
										<CrumbLink target={crumb.target}>{crumb.text}</CrumbLink>
									</BreadcrumbLink>
								) : (
									<BreadcrumbPage className="font-semibold">
										{crumb.text}
									</BreadcrumbPage>
								)}
							</BreadcrumbItem>
						</Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>
			<div className="ml-auto flex items-center gap-3">
				<LocaleSwitcher />
				<ThemeToggle />
			</div>
		</header>
	);
}

function CrumbLink({
	target,
	children,
}: {
	target: ResolvedTarget;
	children: ReactNode;
}) {
	if (target.to === APP_ROUTES.LESSONS.DETAIL) {
		return (
			<Link to={target.to} params={target.params}>
				{children}
			</Link>
		);
	}
	return <Link to={target.to}>{children}</Link>;
}
