import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock, FileText, Users } from "lucide-react";
import { useState } from "react";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { BackButton } from "#/components/common/back-button";
import { ToeicConfigPanel } from "#/features/exams/components/toeic-config-panel";
import {
	type ToeicPartItem,
	ToeicPartsBreakdown,
} from "#/features/exams/components/toeic-parts-breakdown";
import { m } from "#/paraglide/messages";

const MOCK_PARTS: ToeicPartItem[] = [
	{
		partNumber: 1,
		section: "listening",
		type: "Photos",
		questionsCount: 6,
	},
	{
		partNumber: 2,
		section: "listening",
		type: "Question-Response",
		questionsCount: 25,
	},
	{
		partNumber: 3,
		section: "listening",
		type: "Conversations",
		questionsCount: 39,
	},
	{
		partNumber: 4,
		section: "listening",
		type: "Talks",
		questionsCount: 30,
	},
	{
		partNumber: 5,
		section: "reading",
		type: "Incomplete Sentences",
		questionsCount: 30,
	},
	{
		partNumber: 6,
		section: "reading",
		type: "Text Completion",
		questionsCount: 16,
	},
	{
		partNumber: 7,
		section: "reading",
		type: "Reading Comprehension",
		questionsCount: 54,
	},
];

export const Route = createFileRoute("/_app/exams/toeic/$categoryId/$testId/")({
	component: ToeicTestDetailPage,
});

function ToeicTestDetailPage() {
	const navigate = useNavigate();
	const { categoryId, testId } = Route.useParams();

	const [selectedMode, setSelectedMode] = useState<"exam" | "practice">("exam");
	const [selectedParts, setSelectedParts] = useState<number[]>([
		1, 2, 3, 4, 5, 6, 7,
	]);

	const testTitle = `Parroto TOEIC Practice Vol. 1 - ${testId.replace("test-", "Test ")}`;

	useBreadcrumbs([
		{ label: m["exams.toeic.hub.title"](), to: APP_ROUTES.EXAMS.TOEIC.LIST },
		{
			label: "Parroto TOEIC Practice Vol. 1",
			to: APP_ROUTES.EXAMS.TOEIC.CATEGORY,
			params: { categoryId },
		},
		{ label: testTitle },
	]);

	const handleTogglePart = (partNum: number) => {
		setSelectedParts((prev) =>
			prev.includes(partNum)
				? prev.filter((n) => n !== partNum)
				: [...prev, partNum].sort((a, b) => a - b),
		);
	};

	const handleSelectAll = () => {
		setSelectedParts([1, 2, 3, 4, 5, 6, 7]);
	};

	const handleDeselectAll = () => {
		setSelectedParts([]);
	};

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
			{/* Top Back Navigation */}
			<div className="flex items-center">
				<BackButton
					to={APP_ROUTES.EXAMS.TOEIC.CATEGORY}
					params={{ categoryId }}
					label={m["exams.toeic.test.back"]()}
				/>
			</div>

			{/* Test Header */}
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
					{testTitle}
				</h1>
				<div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground md:text-sm">
					<span className="inline-flex items-center gap-1.5">
						<FileText className="size-4" aria-hidden="true" />
						{m["exams.toeic.category.questionsCount"]({ count: 200 })}
					</span>
					<span className="inline-flex items-center gap-1.5">
						<Users className="size-4" aria-hidden="true" />
						{m["exams.toeic.hub.attemptsCount"]({ count: 63636 })}
					</span>
					<span className="inline-flex items-center gap-1.5">
						<Clock className="size-4" aria-hidden="true" />
						{m["exams.toeic.category.durationMinutes"]({ count: 120 })}
					</span>
				</div>
			</div>

			{/* Two-Column Split Layout */}
			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
				{/* Left Column: Parts Breakdown Table */}
				<div className="lg:col-span-7">
					<ToeicPartsBreakdown parts={MOCK_PARTS} />
				</div>

				{/* Right Column: Practice Mode & Part Selection Panel */}
				<div className="lg:col-span-5">
					<ToeicConfigPanel
						selectedMode={selectedMode}
						selectedParts={selectedParts}
						onSelectMode={setSelectedMode}
						onTogglePart={handleTogglePart}
						onSelectAll={handleSelectAll}
						onDeselectAll={handleDeselectAll}
						onStartTest={() => {
							navigate({
								to: APP_ROUTES.EXAMS.TOEIC.TAKE,
								params: { categoryId, testId },
							});
						}}
					/>
				</div>
			</div>
		</div>
	);
}
