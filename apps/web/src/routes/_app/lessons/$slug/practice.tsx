import type {
	Activity,
	ActivityType,
	CheckResult,
	LessonDetail,
} from "@engflex/contracts";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { PageSplit } from "#/components/common/page-layout";
import { CheckQuestionPanel } from "#/features/lessons/components/check-question-panel";
import { ListeningBriefCard } from "#/features/lessons/components/listening/listening-brief-card";
import { PartShell } from "#/features/lessons/components/part-shell";
import { PassagePanel } from "#/features/lessons/components/reading/passage-panel";
import { SpeakingActivity } from "#/features/lessons/components/speaking/read-aloud-card";
import { ModelAnswerCard } from "#/features/lessons/components/writing/model-answer-card";
import { WritingEditorCard } from "#/features/lessons/components/writing/writing-editor-card";
import { WritingPromptBanner } from "#/features/lessons/components/writing/writing-prompt-banner";
import { PART_META } from "#/features/lessons/parts";
import {
	useCheckAnswer,
	useLessonDetailBySlug,
} from "#/features/lessons/queries";
import {
	completePart,
	getFirstIncompleteActivity,
} from "#/features/lessons/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/lessons/$slug/practice")({
	component: PracticePage,
});

function PracticePage() {
	const { slug } = Route.useParams();
	const detailQuery = useLessonDetailBySlug(slug);
	const detail = detailQuery.data;

	if (detailQuery.isPending) return null;
	if (!detail) throw notFound();
	if (detail.activities.length === 0) throw notFound();

	return <PracticeInner key={detail.id} slug={slug} detail={detail} />;
}

function PracticeInner({
	slug,
	detail,
}: {
	slug: string;
	detail: LessonDetail;
}) {
	// lessonId below is the unit id: the store stays id-keyed, the slug is URL-only.
	const lessonId = detail.id;
	useBreadcrumbs([
		{ label: m["nav.item.lessons"](), to: APP_ROUTES.LESSONS.LIST },
		{ label: detail.title },
	]);
	const fallback = detail.activities[0];
	if (!fallback) throw notFound();
	const start =
		getFirstIncompleteActivity(lessonId, detail.activities) ?? fallback;
	const [activePart, setActivePart] = useState<ActivityType>(start.type);

	// Always-on refresh guard: browsers show their own generic prompt text,
	// so no message key exists for it. Cleanup detaches it on unmount so the
	// prompt never leaks onto other pages.
	useEffect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, []);

	const activity = detail.activities.find((item) => item.type === activePart);
	if (!activity) throw notFound();
	const currentPart: ActivityType = activity.type;

	return (
		<PartShell lessonId={lessonId} part={currentPart} onSelect={setActivePart}>
			{currentPart === "reading" && activity?.reading ? (
				<ReadingActivity
					lessonId={lessonId}
					slug={slug}
					activity={activity}
					activities={detail.activities}
					onAdvance={setActivePart}
				/>
			) : null}
			{currentPart === "listening" && activity?.listening ? (
				<ListeningActivity
					lessonId={lessonId}
					slug={slug}
					activity={activity}
					activities={detail.activities}
					onAdvance={setActivePart}
				/>
			) : null}
			{currentPart === "writing" && activity?.writing ? (
				<WritingActivity
					lessonId={lessonId}
					slug={slug}
					activity={activity}
					activities={detail.activities}
					onAdvance={setActivePart}
				/>
			) : null}
			{currentPart === "speaking" && activity?.speaking ? (
				<SpeakingBranch
					lessonId={lessonId}
					slug={slug}
					activity={activity}
					activities={detail.activities}
					onAdvance={setActivePart}
				/>
			) : null}
		</PartShell>
	);
}

/** Shared per-question check state: answers + locked results by index. */
function useCheckedQuestions(activity: Activity) {
	const [index, setIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<number, string>>({});
	const [results, setResults] = useState<Record<number, CheckResult>>({});
	const check = useCheckAnswer();

	function handleCheck() {
		const key = answers[index];
		if (key === undefined || results[index] !== undefined || check.isPending)
			return;
		check.mutate(
			{ activityId: activity.id, questionIndex: index, key },
			{
				onSuccess: (result) => {
					setResults((current) => ({ ...current, [index]: result }));
				},
				onError: () => {
					toast.error(m["lessons.check.failed"]());
				},
			},
		);
	}

	return {
		index,
		setIndex,
		answers,
		setAnswers,
		results,
		pending: check.isPending,
		handleCheck,
	};
}

function useContinue(
	lessonId: string,
	slug: string,
	activity: Activity,
	activities: Activity[],
	onAdvance: (part: ActivityType) => void,
) {
	const navigate = useNavigate();
	const index = activities.findIndex((item) => item.id === activity.id);
	const next = index >= 0 ? activities[index + 1] : undefined;
	const continueLabel = next
		? m["lessons.step.continueTo"]({ part: PART_META[next.type].label() })
		: m["lessons.step.finishLesson"]();

	function handleContinue() {
		completePart(lessonId, activity.partNumber, activities.length);
		if (next) {
			onAdvance(next.type);
		} else {
			navigate({ to: APP_ROUTES.LESSONS.DETAIL, params: { slug } });
		}
	}

	return { continueLabel, handleContinue };
}

function ReadingActivity({
	lessonId,
	slug,
	activity,
	activities,
	onAdvance,
}: {
	lessonId: string;
	slug: string;
	activity: Activity;
	activities: Activity[];
	onAdvance: (part: ActivityType) => void;
}) {
	const payload = activity.reading;
	const checked = useCheckedQuestions(activity);
	const { handleContinue } = useContinue(
		lessonId,
		slug,
		activity,
		activities,
		onAdvance,
	);

	if (!payload) throw notFound();
	const question = payload.questions[checked.index];
	if (!question) throw notFound();
	const isLast = checked.index === payload.questions.length - 1;

	return (
		<PageSplit
			main={
				<PassagePanel
					kicker={PART_META.reading.label()}
					title={activity.title}
					passage={payload.text}
				/>
			}
			aside={
				<CheckQuestionPanel
					question={question}
					questionNumber={checked.index + 1}
					totalQuestions={payload.questions.length}
					selectedKey={checked.answers[checked.index]}
					result={checked.results[checked.index]}
					onSelect={(key) =>
						checked.setAnswers((current) => ({
							...current,
							[checked.index]: key,
						}))
					}
					onCheck={() => checked.handleCheck()}
					onPrev={() => checked.setIndex((current) => Math.max(0, current - 1))}
					onNext={() =>
						checked.setIndex((current) =>
							Math.min(payload.questions.length - 1, current + 1),
						)
					}
					isLast={isLast}
					onContinue={handleContinue}
					pending={checked.pending}
				/>
			}
		/>
	);
}

function ListeningActivity({
	lessonId,
	slug,
	activity,
	activities,
	onAdvance,
}: {
	lessonId: string;
	slug: string;
	activity: Activity;
	activities: Activity[];
	onAdvance: (part: ActivityType) => void;
}) {
	const payload = activity.listening;
	const checked = useCheckedQuestions(activity);
	const { handleContinue } = useContinue(
		lessonId,
		slug,
		activity,
		activities,
		onAdvance,
	);

	if (!payload) throw notFound();
	const question = payload.questions[checked.index];
	if (!question) throw notFound();
	const isLast = checked.index === payload.questions.length - 1;

	return (
		<PageSplit
			main={
				<ListeningBriefCard
					title={activity.title}
					description={activity.description}
					audioUrl={payload.audioUrl}
					transcript={payload.transcript}
					revealed={checked.results[checked.index] !== undefined}
				/>
			}
			aside={
				<CheckQuestionPanel
					question={question}
					questionNumber={checked.index + 1}
					totalQuestions={payload.questions.length}
					selectedKey={checked.answers[checked.index]}
					result={checked.results[checked.index]}
					onSelect={(key) =>
						checked.setAnswers((current) => ({
							...current,
							[checked.index]: key,
						}))
					}
					onCheck={() => checked.handleCheck()}
					onPrev={() => checked.setIndex((current) => Math.max(0, current - 1))}
					onNext={() =>
						checked.setIndex((current) =>
							Math.min(payload.questions.length - 1, current + 1),
						)
					}
					isLast={isLast}
					onContinue={handleContinue}
					pending={checked.pending}
				/>
			}
		/>
	);
}

function WritingActivity({
	lessonId,
	slug,
	activity,
	activities,
	onAdvance,
}: {
	lessonId: string;
	slug: string;
	activity: Activity;
	activities: Activity[];
	onAdvance: (part: ActivityType) => void;
}) {
	const payload = activity.writing;
	const [text, setText] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const { continueLabel, handleContinue } = useContinue(
		lessonId,
		slug,
		activity,
		activities,
		onAdvance,
	);
	const partCount = activities.length;

	if (!payload) throw notFound();

	return (
		<PageSplit
			main={
				<WritingPromptBanner
					partNumber={activity.partNumber}
					partCount={partCount}
					task={payload.task}
					instructions={payload.instructions}
					stimulus={payload.stimulus}
					minWords={payload.minWords}
					maxWords={payload.maxWords}
				/>
			}
			aside={
				<div className="flex flex-col gap-4">
					<WritingEditorCard
						value={text}
						onChange={setText}
						maxWords={payload.maxWords}
						onClear={() => {
							setText("");
							setSubmitted(false);
						}}
						onSubmit={() => setSubmitted(true)}
						submitted={submitted}
					/>
					{submitted ? (
						<ModelAnswerCard
							modelAnswer={payload.modelAnswer}
							checklist={payload.checklist}
							continueLabel={continueLabel}
							onContinue={handleContinue}
						/>
					) : null}
				</div>
			}
		/>
	);
}

function SpeakingBranch({
	lessonId,
	slug,
	activity,
	activities,
	onAdvance,
}: {
	lessonId: string;
	slug: string;
	activity: Activity;
	activities: Activity[];
	onAdvance: (part: ActivityType) => void;
}) {
	const { handleContinue } = useContinue(
		lessonId,
		slug,
		activity,
		activities,
		onAdvance,
	);

	function handleComplete() {
		handleContinue();
	}

	return <SpeakingActivity activity={activity} onComplete={handleComplete} />;
}
