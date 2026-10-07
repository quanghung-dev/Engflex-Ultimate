import type { LessonDetail, UnitSection } from "@engflex/contracts";
import { API_ROUTES } from "#/app/api-routes";
import { api } from "#/lib/api";

/** Whole path, unpaginated: sections arrive with units attached. */
export function listSections(params?: { level?: string }): Promise<UnitSection[]> {
	return api<UnitSection[]>(API_ROUTES.LESSONS.LIST, undefined, {
		query: params?.level ? { level: params.level } : undefined,
	});
}

export function getLessonDetail(id: string): Promise<LessonDetail> {
	return api<LessonDetail>(API_ROUTES.LESSONS.BY_ID(id));
}

export type { LessonDetail, UnitSection };
