import { Link, useRouterState } from "@tanstack/react-router";
import { Flame, Timer } from "lucide-react";
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
import { PROGRESS_SUMMARY } from "#/features/attempts/fixtures";
import { m } from "#/paraglide/messages";

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
		<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-sidebar px-4 backdrop-blur-md">
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
								<BreadcrumbSeparator className="hidden md:block" />
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
										className="font-medium text-muted-foreground hover:text-foreground"
									>
										<CrumbLink target={crumb.target}>{crumb.text}</CrumbLink>
									</BreadcrumbLink>
								) : (
									<BreadcrumbPage>{crumb.text}</BreadcrumbPage>
								)}
							</BreadcrumbItem>
						</Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>
			<div className="ml-auto flex items-center gap-3">
				<LocaleSwitcher />
				<span className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-xs">
					<Flame className="size-[15px] text-amber-500" />
					<span className="font-medium text-foreground">
						{m["progress.streak"]({ count: PROGRESS_SUMMARY.streakDays })}
					</span>
				</span>
				<span className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-xs">
					<Timer className="size-[15px] text-emerald-600" />
					<span>
						{m["progress.todayLabel"]()}{" "}
						<strong className="font-semibold text-foreground">
							{PROGRESS_SUMMARY.todayMinutes}
						</strong>{" "}
						{m["progress.todayGoal"]({
							goal: PROGRESS_SUMMARY.dailyGoalMinutes,
						})}
					</span>
				</span>
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
	if (target.to === APP_ROUTES.LESSON_DETAIL) {
		return (
			<Link to={target.to} params={target.params}>
				{children}
			</Link>
		);
	}
	return <Link to={target.to}>{children}</Link>;
}
