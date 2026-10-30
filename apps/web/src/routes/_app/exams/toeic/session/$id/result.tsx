import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { BackButton } from "#/components/common/back-button";
import { ToeicResultHeaderCard } from "#/features/exams/components/result/toeic-result-header-card";
import {
	type PaletteCardGroup,
	ToeicResultPaletteCard,
} from "#/features/exams/components/result/toeic-result-palette-card";
import {
	type PartScoreItem,
	ToeicResultPartsCard,
} from "#/features/exams/components/result/toeic-result-parts-card";
import {
	type ReviewQuestion,
	ToeicResultReviewSection,
} from "#/features/exams/components/result/toeic-result-review-section";
import { m } from "#/paraglide/messages";

/* ------------------------------------------------------------------ Mock Data */

const MOCK_PART_SCORES: PartScoreItem[] = [
	{
		partNum: 1,
		name: "Photos",
		correctCount: 0,
		totalQuestions: 6,
	},
	{
		partNum: 2,
		name: "Question-Response",
		correctCount: 0,
		totalQuestions: 25,
	},
	{
		partNum: 3,
		name: "Conversations",
		correctCount: 0,
		totalQuestions: 39,
	},
	{
		partNum: 4,
		name: "Talks",
		correctCount: 0,
		totalQuestions: 30,
	},
	{
		partNum: 5,
		name: "Incomplete Sentences",
		correctCount: 0,
		totalQuestions: 30,
	},
	{
		partNum: 6,
		name: "Text Completion",
		correctCount: 0,
		totalQuestions: 16,
	},
	{
		partNum: 7,
		name: "Reading Comprehension",
		correctCount: 0,
		totalQuestions: 54,
	},
];

const MOCK_REVIEW_QUESTIONS: ReviewQuestion[] = [
	{
		id: "q-1",
		questionNumber: 1,
		partNum: 1,
		imageUrl:
			"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
		imageAlt: "A woman operating an office printer and photocopier",
		audioDuration: 28,
		correctKey: "A",
		userKey: null, // Bỏ qua
		options: [
			{
				key: "A",
				text: "She is placing some documents on the copier.",
				translation: "Cô ấy đang đặt một vài tài liệu lên máy photocopy.",
			},
			{
				key: "B",
				text: "She is plugging in a power cord.",
				translation: "Cô ấy đang cắm một sợi dây điện.",
			},
			{
				key: "C",
				text: "She is replacing an ink cartridge.",
				translation: "Cô ấy đang thay một hộp mực.",
			},
			{
				key: "D",
				text: "She is putting on an employee badge.",
				translation: "Cô ấy đang đeo thẻ nhân viên.",
			},
		],
		explanation:
			"Trong ảnh, người phụ nữ đang đứng cạnh máy photocopy văn phòng và mở nắp đặt tài liệu lên mặt kính để quét/in. Đáp án A miêu tả chính xác hành động chính.",
	},
	{
		id: "q-2",
		questionNumber: 2,
		partNum: 1,
		imageUrl:
			"https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
		imageAlt: "Colleagues in a meeting discussing a chart on the board",
		audioDuration: 30,
		correctKey: "C",
		userKey: null,
		options: [
			{
				key: "A",
				text: "They are packing their personal belongings.",
				translation: "Họ đang đóng gói đồ đạc cá nhân.",
			},
			{
				key: "B",
				text: "They are cleaning the conference room floor.",
				translation: "Họ đang lau dọn sàn phòng họp.",
			},
			{
				key: "C",
				text: "They are looking at a presentation board.",
				translation: "Họ đang nhìn vào một bảng thuyết trình.",
			},
			{
				key: "D",
				text: "They are entering an elevator.",
				translation: "Họ đang bước vào một thang máy.",
			},
		],
		explanation:
			"Các đồng nghiệp đang cùng hướng mắt nhìn vào biểu đồ và thảo luận công việc. Đáp án C là miêu tả khách quan và chính xác nhất.",
	},
	{
		id: "q-32",
		questionNumber: 32,
		partNum: 3,
		prompt: "Why is the man calling?",
		correctKey: "B",
		userKey: null,
		options: [
			{
				key: "A",
				text: "To report a problem at a park",
				translation: "Để báo cáo một vấn đề tại công viên",
			},
			{
				key: "B",
				text: "To get information about a volunteer event",
				translation: "Để tìm hiểu thông tin về một sự kiện tình nguyện",
			},
			{
				key: "C",
				text: "To reserve a space at a community center",
				translation: "Để đặt chỗ tại một trung tâm cộng đồng",
			},
			{
				key: "D",
				text: "To request some supplies",
				translation: "Để yêu cầu một số vật dụng",
			},
		],
		explanation:
			"Người đàn ông bắt đầu cuộc trò chuyện bằng câu nói, 'Tôi gọi điện hỏi về ngày dọn dẹp công viên vào thứ Bảy này.' Điều này cho thấy mục đích cuộc gọi là để tìm hiểu thông tin về sự kiện tình nguyện cụ thể này.",
	},
	{
		id: "q-33",
		questionNumber: 33,
		partNum: 3,
		prompt: "What will the woman's organization provide?",
		correctKey: "A",
		userKey: null,
		options: [
			{
				key: "A",
				text: "Work gloves",
				translation: "Găng tay lao động",
			},
			{
				key: "B",
				text: "A map of the park",
				translation: "Một bản đồ công viên",
			},
			{
				key: "C",
				text: "Transportation to the event",
				translation: "Phương tiện di chuyển tới sự kiện",
			},
			{
				key: "D",
				text: "A complimentary T-shirt",
				translation: "Một áo thun miễn phí",
			},
		],
		explanation:
			"Người phụ nữ khẳng định tổ chức sẽ chuẩn bị sẵn túi rác và găng tay lao động cho tất cả các tình nguyện viên tham gia.",
	},
	{
		id: "q-34",
		questionNumber: 34,
		partNum: 3,
		prompt: "What does the woman ask the man to do?",
		correctKey: "C",
		userKey: null,
		options: [
			{
				key: "A",
				text: "Send an email",
				translation: "Gửi một email",
			},
			{
				key: "B",
				text: "Arrive early",
				translation: "Đến sớm hơn",
			},
			{
				key: "C",
				text: "Register online",
				translation: "Đăng ký trực tuyến",
			},
			{
				key: "D",
				text: "Bring identification",
				translation: "Mang theo giấy tờ tùy thân",
			},
		],
		explanation:
			"Người phụ nữ đề nghị người đàn ông truy cập trang web của tổ chức để hoàn tất đăng ký trước thứ Sáu.",
	},
	{
		id: "q-101",
		questionNumber: 101,
		partNum: 5,
		prompt:
			"The new cloud storage system was implemented -------- the considerable initial expense, as the long-term data security benefits were deemed invaluable.",
		correctKey: "A",
		userKey: null,
		options: [
			{ key: "A", text: "despite", translation: "mặc dù (giới từ)" },
			{ key: "B", text: "whereas", translation: "trong khi (liên từ)" },
			{ key: "C", text: "given", translation: "căn cứ vào" },
			{ key: "D", text: "inasmuch as", translation: "bởi vì (liên từ)" },
		],
		explanation:
			"Phía sau chỗ trống là cụm danh từ 'the considerable initial expense'. Cần một giới từ chỉ sự nhượng bộ, chọn 'despite' (+ Noun phrase).",
	},
];

const MOCK_PALETTE_GROUPS: PaletteCardGroup[] = [
	{
		partNum: 1,
		title: "Part 1 (1-6)",
		questions: Array.from({ length: 6 }, (_, i) => ({
			questionNumber: i + 1,
			partNum: 1,
			status: "skipped",
		})),
	},
	{
		partNum: 2,
		title: "Part 2 (7-31)",
		questions: Array.from({ length: 25 }, (_, i) => ({
			questionNumber: i + 7,
			partNum: 2,
			status: "skipped",
		})),
	},
	{
		partNum: 3,
		title: "Part 3 (32-70)",
		questions: Array.from({ length: 39 }, (_, i) => ({
			questionNumber: i + 32,
			partNum: 3,
			status: "skipped",
		})),
	},
	{
		partNum: 4,
		title: "Part 4 (71-100)",
		questions: Array.from({ length: 30 }, (_, i) => ({
			questionNumber: i + 71,
			partNum: 4,
			status: "skipped",
		})),
	},
	{
		partNum: 5,
		title: "Part 5 (101-130)",
		questions: Array.from({ length: 30 }, (_, i) => ({
			questionNumber: i + 101,
			partNum: 5,
			status: "skipped",
		})),
	},
	{
		partNum: 6,
		title: "Part 6 (131-146)",
		questions: Array.from({ length: 16 }, (_, i) => ({
			questionNumber: i + 131,
			partNum: 6,
			status: "skipped",
		})),
	},
	{
		partNum: 7,
		title: "Part 7 (147-200)",
		questions: Array.from({ length: 54 }, (_, i) => ({
			questionNumber: i + 147,
			partNum: 7,
			status: "skipped",
		})),
	},
];

/* ------------------------------------------------------------------ Page Component */

export const Route = createFileRoute("/_app/exams/toeic/session/$id/result")({
	component: ToeicExamResultPage,
});

function ToeicExamResultPage() {
	const [activePart, setActivePart] = useState(1);
	const [selectedFilter, setSelectedFilter] = useState<
		"all" | "incorrect" | "correct"
	>("all");

	useBreadcrumbs([
		{ label: m["exams.toeic.hub.title"](), to: APP_ROUTES.EXAMS.TOEIC.LIST },
		{ label: m["exams.toeic.result.title"]() },
	]);

	const handleNavigateQuestion = (questionNumber: number, partNum: number) => {
		setActivePart(partNum);
		setSelectedFilter("all"); // Ensure not filtered out
		setTimeout(() => {
			const el = document.getElementById(`question-${questionNumber}`);
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}, 80);
	};

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-20">
			{/* Top Back Navigation to TOEIC List */}
			<div className="flex items-center">
				<BackButton
					to={APP_ROUTES.EXAMS.TOEIC.LIST}
					label={m["exams.toeic.result.back"]()}
				/>
			</div>

			{/* Page Title */}
			<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
				{m["exams.toeic.result.title"]()}
			</h1>

			{/* Overall Score Summary Card */}
			<ToeicResultHeaderCard
				totalScore={10}
				listeningScore={5}
				readingScore={5}
				listeningCorrect={0}
				readingCorrect={0}
				durationText="2m"
			/>

			{/* Part Breakdown Card */}
			<ToeicResultPartsCard parts={MOCK_PART_SCORES} />

			{/* Question Map Palette Card (Placed right above Review Section) */}
			<ToeicResultPaletteCard
				groups={MOCK_PALETTE_GROUPS}
				onNavigateQuestion={handleNavigateQuestion}
			/>

			{/* Review Answers Section */}
			<ToeicResultReviewSection
				questions={MOCK_REVIEW_QUESTIONS}
				activePart={activePart}
				onSelectPart={setActivePart}
				selectedFilter={selectedFilter}
				onSelectFilter={setSelectedFilter}
			/>
		</div>
	);
}
