import type { Activity } from "@engflex/contracts";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb, lessonCrumbLabel } from "#/app/breadcrumbs";
import { AudioPlayerBar } from "#/features/dictation/components/audio-player-bar";
import { DialogueContextBox } from "#/features/dictation/components/dialogue-context-box";
import { TranscriptionInput } from "#/features/dictation/components/transcription-input";
import { TranscriptionResultPanel } from "#/features/dictation/components/transcription-result-panel";
import { PartShell } from "#/features/lessons/components/part-shell";
import {
	getLessonById,
	getLessonDetail,
	hasActivityForPart,
} from "#/features/lessons/fixtures";
import {
	getNextPart,
	isLessonPart,
	type LessonPart,
	PART_META,
} from "#/features/lessons/parts";
import { completePart } from "#/features/lessons/store";
import { PassagePanel } from "#/features/reading/components/passage-panel";
import { QuestionPanel } from "#/features/reading/components/question-panel";
import { VoiceBriefCard } from "#/features/voice/components/voice-brief-card";
import { getScenario } from "#/features/voice/fixtures";
import { startSession } from "#/features/voice/store";
import { WritingEditorCard } from "#/features/writing/components/writing-editor-card";
import { WritingFeedbackCard } from "#/features/writing/components/writing-feedback-card";
import { WritingPromptBanner } from "#/features/writing/components/writing-prompt-banner";
import {
	WRITING_FEEDBACK,
	WRITING_SAMPLE_TEXT,
} from "#/features/writing/fixtures";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/lessons/$lessonId/parts/$part")({
	staticData: breadcrumb([
		{ label: () => m["nav.lessons"](), target: { to: APP_ROUTES.LESSONS } },
		{
			label: lessonCrumbLabel,
			target: {
				to: APP_ROUTES.LESSON_DETAIL,
				params: (params) => ({ lessonId: params.lessonId }),
			},
		},
		() => m["lessons.crumbPractice"](),
	]),
	beforeLoad: ({ params }) => {
		if (!getLessonById(params.lessonId)) {
			throw redirect({ href: "/lessons" });
		}
		if (
			!isLessonPart(params.part) ||
			!hasActivityForPart(params.lessonId, params.part)
		) {
			throw redirect({
				to: "/lessons/$lessonId",
				params: { lessonId: params.lessonId },
			});
		}
	},
	component: PracticePage,
});

function PracticePage() {
	const { lessonId, part } = Route.useParams();
	const currentPart: LessonPart = isLessonPart(part) ? part : "reading";
	const detail = getLessonDetail(lessonId);

	if (!detail) return null;
	const activity = detail.activities.find((item) => item.type === currentPart);

	return (
		<PartShell lessonId={lessonId} part={currentPart}>
			{currentPart === "reading" && activity?.reading ? (
				<ReadingActivity
					lessonId={lessonId}
					activity={activity}
					partCount={detail.lesson.partCount}
				/>
			) : null}
			{currentPart === "dictation" && activity?.dictation ? (
				<DictationActivity
					lessonId={lessonId}
					activity={activity}
					partCount={detail.lesson.partCount}
				/>
			) : null}
			{currentPart === "writing" && activity?.writing ? (
				<WritingActivity
					lessonId={lessonId}
					activity={activity}
					partCount={detail.lesson.partCount}
				/>
			) : null}
			{currentPart === "voice" && activity?.voice ? (
				<VoiceActivity lessonId={lessonId} activity={activity} />
			) : null}
		</PartShell>
	);
}

function WritingActivity({
	lessonId,
	activity,
	partCount,
}: {
	lessonId: string;
	activity: Activity;
	partCount: number;
}) {
	const navigate = useNavigate();
	const payload = activity.writing;
	const [text, setText] = useState(WRITING_SAMPLE_TEXT);
	const [submitted, setSubmitted] = useState(false);

	if (!payload) return null;

	const nextPart = getNextPart("writing", partCount);
	const continueLabel = nextPart
		? m["lessons.continueTo"]({ part: PART_META[nextPart].label() })
		: m["lessons.finishLesson"]();

	function handleContinue() {
		completePart(lessonId, activity.partNumber);
		if (nextPart) {
			navigate({
				to: "/lessons/$lessonId/parts/$part",
				params: { lessonId, part: nextPart },
			});
		} else {
			navigate({ to: "/lessons/$lessonId", params: { lessonId } });
		}
	}

	return (
		<div className="container-focus flex flex-col gap-4">
			<WritingPromptBanner
				partNumber={activity.partNumber}
				partCount={partCount}
				title={payload.title}
				minWords={payload.minWords}
				maxWords={payload.maxWords}
				contextQuestions={payload.contextQuestions}
			/>
			<WritingEditorCard
				value={text}
				onChange={setText}
				maxWords={payload.maxWords}
				onClear={() => {
					setText("");
					setSubmitted(false);
				}}
				onSubmit={() => setSubmitted(true)}
			/>
			{submitted ? (
				<WritingFeedbackCard
					feedback={WRITING_FEEDBACK}
					continueLabel={continueLabel}
					onContinue={handleContinue}
				/>
			) : null}
		</div>
	);
}

function VoiceActivity({
	lessonId,
	activity,
}: {
	lessonId: string;
	activity: Activity;
}) {
	const navigate = useNavigate();
	const scenarioId = activity.voice?.scenarioId;
	const scenario = scenarioId ? getScenario(scenarioId) : undefined;

	if (!scenario) return null;

	return (
		<div className="container-focus">
			<VoiceBriefCard
				lessonId={lessonId}
				scenario={scenario}
				onStart={() => {
					completePart(lessonId, activity.partNumber);
					startSession("roleplay", scenario.id);
					navigate({ to: "/voice/room" });
				}}
			/>
		</div>
	);
}

function DictationActivity({
	lessonId,
	activity,
	partCount,
}: {
	lessonId: string;
	activity: Activity;
	partCount: number;
}) {
	const navigate = useNavigate();
	const payload = activity.dictation;
	const [index, setIndex] = useState(0);
	const [typed, setTyped] = useState("");
	const [checked, setChecked] = useState(false);

	if (!payload) return null;
	const sentence = payload.sentences[index];
	if (!sentence) return null;

	const remaining = payload.sentences.length - index - 1;
	const nextPart = getNextPart("dictation", partCount);
	const continueLabel = nextPart
		? m["lessons.continueTo"]({ part: PART_META[nextPart].label() })
		: m["lessons.finishLesson"]();

	function handleContinue() {
		completePart(lessonId, activity.partNumber);
		if (nextPart) {
			navigate({
				to: "/lessons/$lessonId/parts/$part",
				params: { lessonId, part: nextPart },
			});
		} else {
			navigate({ to: "/lessons/$lessonId", params: { lessonId } });
		}
	}

	return (
		<div className="container-focus flex flex-col gap-4">
			<DialogueContextBox prompt={sentence.prompt}>
				<AudioPlayerBar key={index} durationMs={sentence.durationMs} />
			</DialogueContextBox>
			{checked ? (
				<TranscriptionResultPanel
					typed={typed}
					reference={sentence.reference}
					remaining={remaining}
					continueLabel={continueLabel}
					onNext={
						remaining > 0
							? () => {
									setIndex((current) => current + 1);
									setTyped("");
									setChecked(false);
								}
							: undefined
					}
					onContinue={handleContinue}
				/>
			) : (
				<TranscriptionInput
					value={typed}
					onChange={setTyped}
					onClear={() => setTyped("")}
					onCheck={() => setChecked(true)}
				/>
			)}
		</div>
	);
}

function ReadingActivity({
	lessonId,
	activity,
	partCount,
}: {
	lessonId: string;
	activity: Activity;
	partCount: number;
}) {
	const navigate = useNavigate();
	const payload = activity.reading;
	const [index, setIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<number, string>>({});

	if (!payload) return null;
	const question = payload.questions[index];
	if (!question) return null;
	const isLast = index === payload.questions.length - 1;

	function handleContinue() {
		completePart(lessonId, activity.partNumber);
		const nextPart = getNextPart("reading", partCount);
		if (nextPart) {
			navigate({
				to: "/lessons/$lessonId/parts/$part",
				params: { lessonId, part: nextPart },
			});
		} else {
			navigate({ to: "/lessons/$lessonId", params: { lessonId } });
		}
	}

	return (
		<div className="grid gap-4 lg:grid-cols-12">
			<div className="lg:col-span-7">
				<PassagePanel
					kicker="Passage • Personal Intro & Daily Workflow"
					title="A Day in the Life of a Backend Developer"
					passage={payload.passage}
				/>
			</div>
			<div className="lg:col-span-5">
				<QuestionPanel
					question={question}
					questionNumber={index + 1}
					totalQuestions={payload.questions.length}
					selectedKey={answers[index]}
					onSelect={(key) =>
						setAnswers((current) => ({ ...current, [index]: key }))
					}
					onPrev={() => setIndex((current) => Math.max(0, current - 1))}
					onNext={() =>
						setIndex((current) =>
							Math.min(payload.questions.length - 1, current + 1),
						)
					}
					isLast={isLast}
					onContinue={handleContinue}
				/>
			</div>
		</div>
	);
}
