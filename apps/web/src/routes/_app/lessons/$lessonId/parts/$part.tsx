import type { Activity } from "@engflex/contracts";
import {
	createFileRoute,
	notFound,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb, lessonCrumbLabel } from "#/app/breadcrumbs";
import { MoMascot } from "#/components/common/mo-mascot";
import { DialogueContextBox } from "#/features/dictation/components/dialogue-context-box";
import { TranscriptionInput } from "#/features/dictation/components/transcription-input";
import { TranscriptionResultPanel } from "#/features/dictation/components/transcription-result-panel";
import { PartShell } from "#/features/lessons/components/part-shell";
import { VoiceBriefCard } from "#/features/lessons/components/voice-brief-card";
import { useLessonDetail } from "#/features/lessons/queries";
import {
	getNextPart,
	isLessonPart,
	type LessonPart,
	PART_META,
} from "#/features/lessons/parts";
import { completePart } from "#/features/lessons/store";
import { PassagePanel } from "#/features/reading/components/passage-panel";
import { QuestionPanel } from "#/features/reading/components/question-panel";
import { useCreateConversation, useScenario } from "#/features/voice/queries";
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
		{
			label: () => m["nav.item.lessons"](),
			target: { to: APP_ROUTES.LESSONS.LIST },
		},
		{
			label: lessonCrumbLabel,
			target: {
				to: APP_ROUTES.LESSONS.DETAIL,
				params: (params) => ({ lessonId: params.lessonId }),
			},
		},
		() => m["lessons.crumb.practice"](),
	]),
	beforeLoad: ({ params }) => {
		if (!isLessonPart(params.part)) {
			throw redirect({
				to: APP_ROUTES.LESSONS.DETAIL,
				params: { lessonId: params.lessonId },
			});
		}
	},
	component: PracticePage,
});

function PracticePage() {
	const { lessonId, part } = Route.useParams();
	const currentPart: LessonPart = isLessonPart(part) ? part : "reading";
	const detailQuery = useLessonDetail(lessonId);
	const detail = detailQuery.data;

	if (detailQuery.isPending) return null;
	if (!detail) throw notFound();
	const activity = detail.activities.find((item) => item.type === currentPart);
	if (!activity) throw notFound();

	return (
		<PartShell lessonId={lessonId} part={currentPart}>
			{currentPart === "reading" && activity?.reading ? (
				<ReadingActivity
					lessonId={lessonId}
					activity={activity}
					partCount={detail.activities.length}
				/>
			) : null}
			{currentPart === "dictation" && activity?.dictation ? (
				<DictationActivity
					lessonId={lessonId}
					activity={activity}
					partCount={detail.activities.length}
				/>
			) : null}
			{currentPart === "writing" && activity?.writing ? (
				<WritingActivity
					lessonId={lessonId}
					activity={activity}
					partCount={detail.activities.length}
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

	if (!payload) throw notFound();

	const nextPart = getNextPart("writing", partCount);
	const continueLabel = nextPart
		? m["lessons.step.continueTo"]({ part: PART_META[nextPart].label() })
		: m["lessons.step.finishLesson"]();

	function handleContinue() {
		completePart(lessonId, activity.partNumber);
		if (nextPart) {
			navigate({
				to: APP_ROUTES.LESSONS.PART,
				params: { lessonId, part: nextPart },
			});
		} else {
			navigate({ to: APP_ROUTES.LESSONS.DETAIL, params: { lessonId } });
		}
	}

	return (
		<div className="flex w-full flex-col gap-4">
			<div className="grid items-start gap-4 lg:grid-cols-2">
				<WritingPromptBanner
					partNumber={activity.partNumber}
					partCount={partCount}
					title={payload.title}
					minWords={payload.minWords}
					maxWords={payload.maxWords}
					contextQuestions={payload.contextQuestions}
				/>
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
					/>
					{submitted ? (
						<>
							<WritingFeedbackCard
								feedback={WRITING_FEEDBACK}
								continueLabel={continueLabel}
								onContinue={handleContinue}
							/>
							<div
								className="flex items-center gap-3 p-4"
								style={{
									background: "#ffe2c5",
									border: "2px solid var(--border)",
									borderRadius: 24,
									boxShadow: "0 5px 0 var(--border)",
								}}
							>
								<MoMascot
									variant="nice"
									size={40}
									className="hidden sm:inline-flex"
								/>
								<div className="min-w-0">
									<p className="text-[11px] font-bold text-foreground">
										{m["lessons.writing.assessment"]()}
									</p>
									<p className="text-[15px] font-medium text-foreground">
										“{m["lessons.writing.assessmentBody"]()}”
									</p>
								</div>
							</div>
						</>
					) : null}
				</div>
			</div>
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
	const createConversation = useCreateConversation();
	const scenarioId = activity.voice?.scenarioId;
	const scenarioQuery = useScenario(scenarioId);
	const scenario = scenarioQuery.data;

	async function startRoleplay(scenarioId: string) {
		if (createConversation.isPending) return;
		try {
			const conversation = await createConversation.mutateAsync({
				mode: "roleplay",
				scenarioId,
			});
			await navigate({
				to: APP_ROUTES.VOICE.ROOM,
				params: { conversationId: conversation.id },
			});
		} catch {
			toast.error(m["voice.create.failed"]());
		}
	}

	if (scenarioQuery.isPending) return null;
	if (!scenario) throw notFound();

	return (
		<div className="mx-auto w-full max-w-3xl">
			<VoiceBriefCard
				lessonId={lessonId}
				scenario={scenario}
				onStart={() => {
					completePart(lessonId, activity.partNumber);
					void startRoleplay(scenario.id);
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

	if (!payload) throw notFound();
	const sentence = payload.sentences[index];
	if (!sentence) throw notFound();

	const remaining = payload.sentences.length - index - 1;
	const nextPart = getNextPart("dictation", partCount);
	const continueLabel = nextPart
		? m["lessons.step.continueTo"]({ part: PART_META[nextPart].label() })
		: m["lessons.step.finishLesson"]();

	function handleContinue() {
		completePart(lessonId, activity.partNumber);
		if (nextPart) {
			navigate({
				to: APP_ROUTES.LESSONS.PART,
				params: { lessonId, part: nextPart },
			});
		} else {
			navigate({ to: APP_ROUTES.LESSONS.DETAIL, params: { lessonId } });
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
			<DialogueContextBox
				title={activity.title}
				prompt={sentence.prompt}
				durationMs={sentence.durationMs}
			/>
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
					hint={`${sentence.reference.split(" ").slice(0, 3).join(" ")} …`}
				/>
			)}
			<div
				className="flex items-center gap-3 p-4"
				style={{
					background: "#ffe2c5",
					border: "2px solid var(--border)",
					borderRadius: 24,
					boxShadow: "0 5px 0 var(--border)",
				}}
			>
				<MoMascot variant="nice" size={40} className="hidden sm:inline-flex" />
				<div className="min-w-0">
					<p className="text-[11px] font-bold text-foreground">
						{m["lessons.dictation.coach.title"]()}
					</p>
					<p className="text-[15px] font-medium text-foreground">
						{m["lessons.dictation.coach.body"]()}
					</p>
				</div>
			</div>
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

	if (!payload) throw notFound();
	const question = payload.questions[index];
	if (!question) throw notFound();
	const isLast = index === payload.questions.length - 1;

	function handleContinue() {
		completePart(lessonId, activity.partNumber);
		const nextPart = getNextPart("reading", partCount);
		if (nextPart) {
			navigate({
				to: APP_ROUTES.LESSONS.PART,
				params: { lessonId, part: nextPart },
			});
		} else {
			navigate({ to: APP_ROUTES.LESSONS.DETAIL, params: { lessonId } });
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
