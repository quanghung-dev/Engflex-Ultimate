import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { ToeicExamHeader } from "#/features/exams/components/taking/toeic-exam-header";
import {
	ConfirmExitModal,
	ConfirmSubmitModal,
} from "#/features/exams/components/taking/toeic-exam-modals";
import {
	type PartMetaItem,
	ToeicExamTabBar,
} from "#/features/exams/components/taking/toeic-exam-tab-bar";
import {
	type Part1QuestionItem,
	ToeicPart1Question,
} from "#/features/exams/components/taking/toeic-part1-question";
import {
	type Part2QuestionItem,
	ToeicPart2Question,
} from "#/features/exams/components/taking/toeic-part2-question";
import {
	type Part5QuestionItem,
	ToeicPart5Question,
} from "#/features/exams/components/taking/toeic-part5-question";
import {
	type Part34SetItem,
	ToeicPart34Set,
} from "#/features/exams/components/taking/toeic-part34-set";
import {
	type PaletteGroup,
	ToeicQuestionPalette,
} from "#/features/exams/components/taking/toeic-question-palette";

/* ------------------------------------------------------------------ Mock Data */

const MOCK_PART1_QUESTIONS: Part1QuestionItem[] = [
	{
		id: "q-1",
		questionNumber: 1,
		imageUrl:
			"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
		imageAlt: "A woman operating an office printer and photocopier",
		audioDuration: 28,
	},
	{
		id: "q-2",
		questionNumber: 2,
		imageUrl:
			"https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
		imageAlt: "Colleagues in a meeting discussing a chart on the board",
		audioDuration: 30,
	},
];

const MOCK_PART2_QUESTIONS: Part2QuestionItem[] = [
	{ id: "q-7", questionNumber: 7, audioDuration: 20 },
	{ id: "q-8", questionNumber: 8, audioDuration: 24 },
	{ id: "q-9", questionNumber: 9, audioDuration: 19 },
	{ id: "q-10", questionNumber: 10, audioDuration: 21 },
];

const MOCK_PART3_SET: Part34SetItem = {
	setId: "set-p3-1",
	audioDuration: 102,
	questions: [
		{
			id: "q-32",
			questionNumber: 32,
			prompt: "Why is the man calling?",
			options: [
				{ key: "A", text: "To report a problem at a park" },
				{ key: "B", text: "To get information about a volunteer event" },
				{ key: "C", text: "To reserve a space at a community center" },
				{ key: "D", text: "To request some supplies" },
			],
		},
		{
			id: "q-33",
			questionNumber: 33,
			prompt: "What will the woman's organization provide?",
			options: [
				{ key: "A", text: "Work gloves" },
				{ key: "B", text: "A map of the park" },
				{ key: "C", text: "Transportation to the event" },
				{ key: "D", text: "A complimentary T-shirt" },
			],
		},
		{
			id: "q-34",
			questionNumber: 34,
			prompt: "What does the woman ask the man to do?",
			options: [
				{ key: "A", text: "Send an email" },
				{ key: "B", text: "Arrive early" },
				{ key: "C", text: "Register online" },
				{ key: "D", text: "Bring identification" },
			],
		},
	],
};

const MOCK_PART4_SET: Part34SetItem = {
	setId: "set-p4-1",
	audioDuration: 96,
	questions: [
		{
			id: "q-71",
			questionNumber: 71,
			prompt: "Why is the speaker calling?",
			options: [
				{ key: "A", text: "To launch a new product" },
				{ key: "B", text: "To discuss an advertising campaign's performance" },
				{ key: "C", text: "To request a larger budget" },
				{ key: "D", text: "To schedule a meeting with a newspaper" },
			],
		},
		{
			id: "q-72",
			questionNumber: 72,
			prompt: "Which type of advertisement has been successful?",
			options: [
				{ key: "A", text: "Newspaper coupons" },
				{ key: "B", text: "Television commercials" },
				{ key: "C", text: "Social media posts" },
				{ key: "D", text: "Website banners" },
			],
		},
		{
			id: "q-73",
			questionNumber: 73,
			prompt: "What does the speaker recommend doing next?",
			options: [
				{ key: "A", text: "Hire additional graphic designers" },
				{ key: "B", text: "Extend the promotional discount" },
				{ key: "C", text: "Focus spending on online channels" },
				{ key: "D", text: "Review customer survey results" },
			],
		},
	],
};

const MOCK_PART5_QUESTIONS: Part5QuestionItem[] = [
	{
		id: "q-101",
		questionNumber: 101,
		sentence:
			"The new cloud storage system was implemented -------- the considerable initial expense, as the long-term data security benefits were deemed invaluable.",
		options: [
			{ key: "A", text: "despite" },
			{ key: "B", text: "whereas" },
			{ key: "C", text: "given" },
			{ key: "D", text: "inasmuch as" },
		],
	},
	{
		id: "q-102",
		questionNumber: 102,
		sentence:
			"By the time the new assembly line is fully operational, the factory ------- its production capacity by nearly 30 percent.",
		options: [
			{ key: "A", text: "will have increased" },
			{ key: "B", text: "increases" },
			{ key: "C", text: "is increasing" },
			{ key: "D", text: "has increased" },
		],
	},
	{
		id: "q-103",
		questionNumber: 103,
		sentence:
			"The manager of Delancy's Department Store requested that all seasonal decorations -------- by November 15th.",
		options: [
			{ key: "A", text: "be installed" },
			{ key: "B", text: "are installing" },
			{ key: "C", text: "will install" },
			{ key: "D", text: "installed" },
		],
	},
];

const PALETTE_GROUPS: PaletteGroup[] = [
	{
		partNum: 1,
		title: "Part 1 (1-6)",
		questions: [1, 2, 3, 4, 5, 6],
	},
	{
		partNum: 2,
		title: "Part 2 (7-31)",
		questions: Array.from({ length: 25 }, (_, i) => i + 7),
	},
	{
		partNum: 3,
		title: "Part 3 (32-70)",
		questions: Array.from({ length: 39 }, (_, i) => i + 32),
	},
	{
		partNum: 4,
		title: "Part 4 (71-100)",
		questions: Array.from({ length: 30 }, (_, i) => i + 71),
	},
	{
		partNum: 5,
		title: "Part 5 (101-130)",
		questions: Array.from({ length: 30 }, (_, i) => i + 101),
	},
];

/* ------------------------------------------------------------------ Page Component */

export const Route = createFileRoute(
	"/_app/exams/toeic/$categoryId/$testId/take",
)({
	component: ToeicExamTakingPage,
});

function ToeicExamTakingPage() {
	const navigate = useNavigate();
	const { categoryId, testId } = Route.useParams();

	const [activePart, setActivePart] = useState(1);
	const [activeQuestionNumber, setActiveQuestionNumber] = useState(1);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
	const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
	const [timeLeft, setTimeLeft] = useState(119 * 60 + 58); // 119m 58s
	const [speed, setSpeed] = useState(1);
	const [showSubmitModal, setShowSubmitModal] = useState(false);
	const [showExitModal, setShowExitModal] = useState(false);

	const testTitle = `Parroto TOEIC Practice Vol. 1 - ${testId.replace("test-", "Test ")}`;

	// Countdown Timer interval
	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const handleCycleSpeed = () => {
		setSpeed((prev) => (prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1));
	};

	const handleSelectOption = (questionId: string, option: string) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: option,
		}));
	};

	const handleToggleBookmark = (questionId: string) => {
		setBookmarks((prev) => {
			const next = new Set(prev);
			if (next.has(questionId)) {
				next.delete(questionId);
			} else {
				next.add(questionId);
			}
			return next;
		});
	};

	const handleSelectQuestion = (qNum: number) => {
		setActiveQuestionNumber(qNum);
		if (qNum <= 6) setActivePart(1);
		else if (qNum <= 31) setActivePart(2);
		else if (qNum <= 70) setActivePart(3);
		else if (qNum <= 100) setActivePart(4);
		else setActivePart(5);
	};

	const handleConfirmExit = () => {
		setShowExitModal(false);
		navigate({
			to: APP_ROUTES.EXAMS.TOEIC.TEST,
			params: { categoryId, testId },
		});
	};

	const handleConfirmSubmit = () => {
		setShowSubmitModal(false);
		toast.success("Nộp bài thi thành công!");
		navigate({
			to: APP_ROUTES.EXAMS.TOEIC.TEST,
			params: { categoryId, testId },
		});
	};

	// Calculate counts for tab bar
	const partMetas: PartMetaItem[] = [
		{
			partNum: 1,
			section: "listening",
			label: "P1",
			totalQuestions: 6,
			answeredCount: Object.keys(answers).filter((k) => {
				const n = Number(k.replace("q-", ""));
				return n >= 1 && n <= 6;
			}).length,
		},
		{
			partNum: 2,
			section: "listening",
			label: "P2",
			totalQuestions: 25,
			answeredCount: Object.keys(answers).filter((k) => {
				const n = Number(k.replace("q-", ""));
				return n >= 7 && n <= 31;
			}).length,
		},
		{
			partNum: 3,
			section: "listening",
			label: "P3",
			totalQuestions: 39,
			answeredCount: Object.keys(answers).filter((k) => {
				const n = Number(k.replace("q-", ""));
				return n >= 32 && n <= 70;
			}).length,
		},
		{
			partNum: 4,
			section: "listening",
			label: "P4",
			totalQuestions: 30,
			answeredCount: Object.keys(answers).filter((k) => {
				const n = Number(k.replace("q-", ""));
				return n >= 71 && n <= 100;
			}).length,
		},
		{
			partNum: 5,
			section: "reading",
			label: "P5",
			totalQuestions: 30,
			answeredCount: Object.keys(answers).filter((k) => {
				const n = Number(k.replace("q-", ""));
				return n >= 101 && n <= 130;
			}).length,
		},
		{
			partNum: 6,
			section: "reading",
			label: "P6",
			totalQuestions: 16,
			answeredCount: 0,
		},
		{
			partNum: 7,
			section: "reading",
			label: "P7",
			totalQuestions: 54,
			answeredCount: 0,
		},
	];

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-hidden select-none">
			{/* Top Bar Header */}
			<ToeicExamHeader
				testTitle={testTitle}
				timeLeft={timeLeft}
				speed={speed}
				onCycleSpeed={handleCycleSpeed}
				onSubmitClick={() => setShowSubmitModal(true)}
				onExitClick={() => setShowExitModal(true)}
			/>

			{/* Part Selection Tabs */}
			<ToeicExamTabBar
				parts={partMetas}
				activePart={activePart}
				onSelectPart={(pNum) => {
					setActivePart(pNum);
					if (pNum === 1) setActiveQuestionNumber(1);
					else if (pNum === 2) setActiveQuestionNumber(7);
					else if (pNum === 3) setActiveQuestionNumber(32);
					else if (pNum === 4) setActiveQuestionNumber(71);
					else if (pNum === 5) setActiveQuestionNumber(101);
				}}
			/>

			{/* Main Split Content Area */}
			<div className="flex flex-1 min-h-0 overflow-hidden">
				{/* Scrollable Questions Main View */}
				<main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-5">
					<div className="flex w-full flex-col gap-4 md:gap-5">
						{activePart === 1 &&
							MOCK_PART1_QUESTIONS.map((q) => (
								<ToeicPart1Question
									key={q.id}
									item={q}
									selectedOption={answers[q.id]}
									isBookmarked={bookmarks.has(q.id)}
									onSelectOption={(opt) => handleSelectOption(q.id, opt)}
									onToggleBookmark={() => handleToggleBookmark(q.id)}
								/>
							))}

						{activePart === 2 &&
							MOCK_PART2_QUESTIONS.map((q) => (
								<ToeicPart2Question
									key={q.id}
									item={q}
									selectedOption={answers[q.id]}
									isBookmarked={bookmarks.has(q.id)}
									onSelectOption={(opt) => handleSelectOption(q.id, opt)}
									onToggleBookmark={() => handleToggleBookmark(q.id)}
								/>
							))}

						{activePart === 3 && (
							<ToeicPart34Set
								set={MOCK_PART3_SET}
								answers={answers}
								bookmarks={bookmarks}
								onSelectOption={handleSelectOption}
								onToggleBookmark={handleToggleBookmark}
							/>
						)}

						{activePart === 4 && (
							<ToeicPart34Set
								set={MOCK_PART4_SET}
								answers={answers}
								bookmarks={bookmarks}
								onSelectOption={handleSelectOption}
								onToggleBookmark={handleToggleBookmark}
							/>
						)}

						{activePart === 5 &&
							MOCK_PART5_QUESTIONS.map((q) => (
								<ToeicPart5Question
									key={q.id}
									item={q}
									selectedOption={answers[q.id]}
									isBookmarked={bookmarks.has(q.id)}
									onSelectOption={(opt) => handleSelectOption(q.id, opt)}
									onToggleBookmark={() => handleToggleBookmark(q.id)}
								/>
							))}

						{activePart > 5 && (
							<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
								<p className="text-sm font-medium">
									Nội dung Part {activePart} đang được hoàn thiện.
								</p>
							</div>
						)}
					</div>
				</main>

				{/* Right Questions Palette Drawer */}
				<aside className="shrink-0 h-full">
					<ToeicQuestionPalette
						isCollapsed={isPaletteCollapsed}
						onToggleCollapse={() => setIsPaletteCollapsed((prev) => !prev)}
						groups={PALETTE_GROUPS}
						activeQuestionNumber={activeQuestionNumber}
						answers={answers}
						bookmarks={bookmarks}
						onSelectQuestion={handleSelectQuestion}
					/>
				</aside>
			</div>

			{/* Confirm Submit Dialog */}
			<ConfirmSubmitModal
				isOpen={showSubmitModal}
				answeredCount={Object.keys(answers).length}
				totalCount={200}
				onClose={() => setShowSubmitModal(false)}
				onConfirm={handleConfirmSubmit}
			/>

			{/* Confirm Exit Dialog */}
			<ConfirmExitModal
				isOpen={showExitModal}
				onClose={() => setShowExitModal(false)}
				onConfirm={handleConfirmExit}
			/>
		</div>
	);
}
