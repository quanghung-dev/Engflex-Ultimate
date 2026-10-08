import type {
	CheckResult,
	LessonDetail,
	PronunciationResult,
	UnitSection,
} from "@engflex/contracts";
import { API_ROUTES } from "#/app/api-routes";
import { api } from "#/lib/api";

/** Whole path, unpaginated: sections arrive with units attached. */
export function listSections(params?: {
	level?: string;
}): Promise<UnitSection[]> {
	return api<UnitSection[]>(API_ROUTES.LESSONS.LIST, undefined, {
		query: params?.level ? { level: params.level } : undefined,
	});
}

export function getLessonDetail(id: string): Promise<LessonDetail> {
	return api<LessonDetail>(API_ROUTES.LESSONS.BY_ID(id));
}

export function getLessonDetailBySlug(slug: string): Promise<LessonDetail> {
	return api<LessonDetail>(API_ROUTES.LESSONS.BY_SLUG(slug));
}

export function checkAnswer(
	activityId: string,
	questionIndex: number,
	key: string,
): Promise<CheckResult> {
	return api<CheckResult>(API_ROUTES.LESSONS.CHECK(activityId), {
		method: "POST",
		body: JSON.stringify({ questionIndex, key }),
	});
}

export function pronounceAttempt(
	activityId: string,
	itemIndex: number,
	audio: Blob,
	mime: string,
): Promise<PronunciationResult> {
	const form = new FormData();
	form.append("itemIndex", String(itemIndex));
	form.append(
		"audio",
		audio,
		mime.includes("wav") ? "attempt.wav" : "attempt.webm",
	);
	return api<PronunciationResult>(API_ROUTES.LESSONS.PRONOUNCE(activityId), {
		method: "POST",
		body: form,
	});
}

export type { CheckResult, LessonDetail, PronunciationResult, UnitSection };
