import type { APP_ROUTES } from "#/app/app-route";
import { getLessonDetail } from "#/features/lessons/fixtures";
import { getVocabularyItem } from "#/features/vocabulary/store";
import { m } from "#/paraglide/messages";

export type RouteParams = Record<string, string>;

/** A crumb label: static text, or a function for param routes (fixture titles). */
export type CrumbLabel = string | ((params: RouteParams) => string);

/** Section paths a crumb may link to, sourced from the central route constants. */
export type CrumbPath =
	| typeof APP_ROUTES.HOME
	| typeof APP_ROUTES.ABOUT
	| typeof APP_ROUTES.LESSONS.LIST
	| typeof APP_ROUTES.VOCABULARY.LIST
	| typeof APP_ROUTES.VOICE.LIST;

/** Explicit link target for a crumb that is not the current page. */
export type CrumbTarget =
	| { to: CrumbPath }
	| {
			to: typeof APP_ROUTES.LESSONS.DETAIL;
			params: (params: RouteParams) => { lessonId: string };
	  };

/** Either a bare label (current page, or auto-linked via the match chain) or a labeled link. */
export type CrumbSpec = CrumbLabel | { label: CrumbLabel; target: CrumbTarget };

export interface BreadcrumbStaticData {
	breadcrumb: CrumbSpec | CrumbSpec[];
}

/**
 * Declares breadcrumbs on a route — `staticData: breadcrumb(["Lessons", lessonCrumbLabel])`.
 * No route ids are hardcoded; targets come from `APP_ROUTES`, labels may resolve fixtures.
 * Multiple labels let one route contribute several crumbs (Home → Daily practice);
 * the last crumb of the whole trail renders as the current page.
 */
export function breadcrumb(
	labels: CrumbSpec | CrumbSpec[],
): BreadcrumbStaticData {
	return { breadcrumb: labels };
}

/** `staticData` is an open map on the router side, so narrow it in one place. */
export function readBreadcrumb(
	staticData: unknown,
): CrumbSpec | CrumbSpec[] | undefined {
	return (staticData as BreadcrumbStaticData | undefined)?.breadcrumb;
}

export const lessonCrumbLabel = (params: RouteParams) =>
	getLessonDetail(params.lessonId)?.lesson.title ??
	m["lessons.crumb.detailFallback"]();

export const vocabularyCrumbLabel = (params: RouteParams) =>
	getVocabularyItem(params.itemId)?.term ??
	m["vocabulary.crumb.detailFallback"]();

export function crumbLabel(label: CrumbLabel, params: RouteParams): string {
	return typeof label === "function" ? label(params) : label;
}

/** A crumb target with its params already resolved for rendering. */
export type ResolvedTarget =
	| { to: CrumbPath }
	| { to: typeof APP_ROUTES.LESSONS.DETAIL; params: { lessonId: string } };

export function resolveTarget(
	target: CrumbTarget | undefined,
	params: RouteParams,
): ResolvedTarget | undefined {
	if (!target) return undefined;
	if ("params" in target)
		return { to: target.to, params: target.params(params) };
	return { to: target.to };
}
