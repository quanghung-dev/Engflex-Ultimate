import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { EmptyList } from "#/components/common/empty-list";
import { PageLayout } from "#/components/common/page-layout";
import {
	StoryCard,
	type StoryCardItem,
} from "#/features/stories/components/story-card";
import { StoryFilterBar } from "#/features/stories/components/story-filter-bar";
import { m } from "#/paraglide/messages";

const MOCK_STORIES: StoryCardItem[] = [
	{
		id: "11111111-1111-1111-1111-111111111111",
		slug: "cinderella",
		title: "Cinderella",
		titleVietnamese: "Cô bé Lọ Lem",
		cefrLevel: "B1",
		topic: "Anh em Grimm",
		thumbnailUrl:
			"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
		audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
		duration: 540,
		views: 4667,
		bookmarks: 31,
		saved: true,
		createdAt: "2026-10-01T00:00:00Z",
	},
	{
		id: "22222222-2222-2222-2222-222222222222",
		slug: "little-red-cap",
		title: "Little Red Cap",
		titleVietnamese: "Cô bé quàng khăn đỏ",
		cefrLevel: "A1",
		topic: "Anh em Grimm",
		thumbnailUrl:
			"https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
		audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
		duration: 300,
		views: 3271,
		bookmarks: 35,
		saved: false,
		createdAt: "2026-10-02T00:00:00Z",
	},
	{
		id: "33333333-3333-3333-3333-333333333333",
		slug: "snow-white",
		title: "Snow-White",
		titleVietnamese: "Nàng Bạch Tuyết",
		cefrLevel: "B2",
		topic: "Anh em Grimm",
		thumbnailUrl:
			"https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop&q=80",
		audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
		duration: 540,
		views: 1668,
		bookmarks: 9,
		saved: false,
		createdAt: "2026-10-03T00:00:00Z",
	},
	{
		id: "44444444-4444-4444-4444-444444444444",
		slug: "hansel-and-gretel",
		title: "Hansel and Gretel",
		titleVietnamese: "Hansel và Gretel",
		cefrLevel: "A2",
		topic: "Anh em Grimm",
		thumbnailUrl:
			"https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80",
		audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
		duration: 360,
		views: 1476,
		bookmarks: 7,
		saved: false,
		createdAt: "2026-10-04T00:00:00Z",
	},
	{
		id: "55555555-5555-5555-5555-555555555555",
		slug: "sleeping-beauty",
		title: "Sleeping Beauty (Little Briar Rose)",
		titleVietnamese: "Người đẹp ngủ trong rừng",
		cefrLevel: "A1",
		topic: "Anh em Grimm",
		thumbnailUrl:
			"https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=800&auto=format&fit=crop&q=80",
		audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
		duration: 300,
		views: 1448,
		bookmarks: 10,
		saved: false,
		createdAt: "2026-10-05T00:00:00Z",
	},
	{
		id: "66666666-6666-6666-6666-666666666666",
		slug: "the-little-mermaid",
		title: "The Little Mermaid",
		titleVietnamese: "Nàng tiên cá",
		cefrLevel: "C1",
		topic: "H. C. Andersen",
		thumbnailUrl:
			"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
		audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
		duration: 660,
		views: 1433,
		bookmarks: 11,
		saved: false,
		createdAt: "2026-10-06T00:00:00Z",
	},
];

export const Route = createFileRoute("/_app/stories/")({
	component: StoriesListPage,
});

function StoriesListPage() {
	useBreadcrumbs([{ label: m["stories.title"]() }]);

	const [tab, setTab] = useState<"all" | "saved">("all");
	const [level, setLevel] = useState<string>("all");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [search, setSearch] = useState<string>("");

	// Dynamically extract categories from the stories dataset
	const categories = useMemo(() => {
		return Array.from(
			new Set(MOCK_STORIES.map((s) => s.topic).filter(Boolean)),
		);
	}, []);

	const filteredStories = useMemo(() => {
		return MOCK_STORIES.filter((story) => {
			if (tab === "saved" && !story.saved) return false;
			if (level !== "all" && story.cefrLevel !== level) return false;
			if (selectedCategory !== "all" && story.topic !== selectedCategory) {
				return false;
			}
			if (search.trim()) {
				const q = search.toLowerCase();
				const matchEn = story.title.toLowerCase().includes(q);
				const matchVi = (story.titleVietnamese ?? "").toLowerCase().includes(q);
				if (!matchEn && !matchVi) return false;
			}
			return true;
		}).sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
	}, [tab, level, selectedCategory, search]);

	function handleReset() {
		setTab("all");
		setLevel("all");
		setSelectedCategory("all");
		setSearch("");
	}

	return (
		<PageLayout>
			<StoryFilterBar
				tab={tab}
				onTabChange={setTab}
				level={level}
				onLevelChange={setLevel}
				categories={categories}
				selectedCategory={selectedCategory}
				onCategoryChange={setSelectedCategory}
				search={search}
				onSearchChange={setSearch}
			/>

			{filteredStories.length === 0 ? (
				<EmptyList title={m["stories.empty"]()} onReset={handleReset} />
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{filteredStories.map((story) => (
						<StoryCard key={story.id} story={story} />
					))}
				</div>
			)}
		</PageLayout>
	);
}
