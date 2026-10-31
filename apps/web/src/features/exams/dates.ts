import { m } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

export function formatExamDate(value: string | null): string {
	if (!value || Number.isNaN(new Date(value).getTime()))
		return m["exams.attempt.unavailable"]();
	return new Intl.DateTimeFormat(getLocale(), {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}
export function formatExamDuration(seconds: number | null): string {
	if (seconds === null || !Number.isFinite(seconds))
		return m["exams.attempt.unavailable"]();
	const total = Math.max(0, Math.floor(seconds));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const remainder = total % 60;
	return [
		hours ? m["exams.attempt.duration.hours"]({ count: hours }) : "",
		minutes ? m["exams.attempt.duration.minutes"]({ count: minutes }) : "",
		remainder || (!hours && !minutes)
			? m["exams.attempt.duration.seconds"]({ count: remainder })
			: "",
	]
		.filter(Boolean)
		.join(" ");
}
