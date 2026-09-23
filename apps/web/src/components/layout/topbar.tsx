import { BREADCRUMB_LABELS } from "#/app/app-route";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { Separator } from "#/components/ui/separator";
import { SidebarTrigger } from "#/components/ui/sidebar";
import { PROGRESS_SUMMARY } from "#/features/attempts/fixtures";
import { useRouterState } from "@tanstack/react-router";
import { Flame, Timer } from "lucide-react";
import { Fragment } from "react";

export function Topbar() {
  const crumbs = useRouterState({
    select: (state) =>
      BREADCRUMB_LABELS[state.matches.at(-1)?.routeId ?? ""] ?? ["Engflex"],
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
          {crumbs.map((label, index) => (
            <Fragment key={label}>
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
                {index === crumbs.length - 1 ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <span className="font-medium text-muted-foreground">
                    {label}
                  </span>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-xs">
          <Flame className="size-[15px] text-amber-500" />
          <span className="font-medium text-foreground">
            {PROGRESS_SUMMARY.streakDays}-day streak
          </span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground shadow-xs">
          <Timer className="size-[15px] text-emerald-600" />
          <span>
            Today:{" "}
            <strong className="font-semibold text-foreground">
              {PROGRESS_SUMMARY.todayMinutes}
            </strong>{" "}
            / {PROGRESS_SUMMARY.dailyGoalMinutes} min
          </span>
        </span>

      </div>
    </header>
  );
}
