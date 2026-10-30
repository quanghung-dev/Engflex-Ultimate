import { createFileRoute } from "@tanstack/react-router";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { BackButton } from "#/components/common/back-button";
import { ToeicCategoryHero } from "#/features/exams/components/toeic-category-hero";
import {
	ToeicTestCard,
	type ToeicTestItem,
} from "#/features/exams/components/toeic-test-card";
import { m } from "#/paraglide/messages";

interface MockCategoryDetail {
	id: string;
	title: string;
	tags: string[];
	testsCount: number;
	attemptsCount: number;
}

const MOCK_CATEGORY_DATA: Record<string, MockCategoryDetail> = {
	"parroto-vol-1": {
		id: "parroto-vol-1",
		title: "Bộ đề Parroto TOEIC Practice Vol. 1",
		tags: ["parroto", "2026"],
		testsCount: 10,
		attemptsCount: 90459,
	},
	"toeic-2026": {
		id: "toeic-2026",
		title: "Bộ đề TOEIC 2026",
		tags: ["TOEIC", "2026"],
		testsCount: 10,
		attemptsCount: 206081,
	},
	"toeic-2024": {
		id: "toeic-2024",
		title: "Bộ đề TOEIC 2024",
		tags: ["TOEIC", "2024"],
		testsCount: 10,
		attemptsCount: 29398,
	},
	"toeic-2023": {
		id: "toeic-2023",
		title: "Bộ đề TOEIC 2023",
		tags: ["TOEIC", "2023"],
		testsCount: 10,
		attemptsCount: 27835,
	},
};

const DEFAULT_CATEGORY: MockCategoryDetail = {
	id: "parroto-vol-1",
	title: "Bộ đề Parroto TOEIC Practice Vol. 1",
	tags: ["parroto", "2026"],
	testsCount: 10,
	attemptsCount: 90459,
};

function generateMockTests(
	categoryId: string,
	categoryTitle: string,
): ToeicTestItem[] {
	const attemptCounts = [
		63636, 8809, 5477, 2772, 2489, 1608, 1489, 1241, 1283, 1655,
	];

	return Array.from({ length: 10 }, (_, i) => ({
		id: `test-${i + 1}`,
		categoryId,
		title: `${categoryTitle.replace(/^Bộ đề\s+/, "")} - Test ${i + 1}`,
		isFree: true,
		questionsCount: 200,
		attemptsCount: attemptCounts[i] ?? 1000,
		durationMinutes: 120,
	}));
}

export const Route = createFileRoute("/_app/exams/toeic/$categoryId/")({
	component: ToeicCategoryDetailPage,
});

function ToeicCategoryDetailPage() {
	const { categoryId } = Route.useParams();
	const category = MOCK_CATEGORY_DATA[categoryId] ?? DEFAULT_CATEGORY;
	const tests = generateMockTests(category.id, category.title);

	useBreadcrumbs([
		{ label: m["exams.toeic.hub.title"](), to: APP_ROUTES.EXAMS.TOEIC.LIST },
		{ label: category.title },
	]);

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
			{/* Top Navigation */}
			<div className="flex items-center">
				<BackButton
					to={APP_ROUTES.EXAMS.TOEIC.LIST}
					label={m["exams.toeic.category.back"]()}
				/>
			</div>

			{/* Category Hero Banner */}
			<ToeicCategoryHero
				title={category.title}
				tags={category.tags}
				testsCount={category.testsCount}
				attemptsCount={category.attemptsCount}
			/>

			{/* Test List Section */}
			<div className="flex flex-col gap-4">
				<h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase md:text-sm">
					{m["exams.toeic.category.testsListTitle"]()}
				</h2>

				<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
					{tests.map((test) => (
						<ToeicTestCard key={test.id} item={test} />
					))}
				</div>
			</div>
		</div>
	);
}
