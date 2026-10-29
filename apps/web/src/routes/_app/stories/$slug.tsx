import { createFileRoute } from "@tanstack/react-router";
import { cn } from "cn";
import { Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { StoryAudioPlayer } from "#/features/stories/components/story-audio-player";
import {
	StoryReaderHeader,
	type StoryReaderHeaderItem,
} from "#/features/stories/components/story-reader-header";
import { TextActionDock } from "#/features/vocabulary/components/text-action-dock";
import { m } from "#/paraglide/messages";

const MOCK_CINDERELLA_DETAIL: StoryReaderHeaderItem = {
	id: "11111111-1111-1111-1111-111111111111",
	slug: "cinderella",
	title: "Cinderella",
	titleVietnamese: "Cô bé Lọ Lem",
	cefrLevel: "B1",
	topic: "Anh em Grimm",
	thumbnailUrl:
		"https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80",
	audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
	duration: 413,
	bookmarks: 31,
	saved: true,
	createdAt: "2026-10-01T00:00:00Z",
	sentences: [
		{
			id: "s-1",
			storyId: "11111111-1111-1111-1111-111111111111",
			sequence: 1,
			englishText:
				"A rich man's wife became very ill, and she called her only daughter to her bed.",
			vietnameseText:
				"Vợ của một người đàn ông giàu có lâm bệnh nặng, bà gọi cô con gái duy nhất đến bên giường.",
			startTimestamp: 0,
			endTimestamp: 6.5,
		},
		{
			id: "s-2",
			storyId: "11111111-1111-1111-1111-111111111111",
			sequence: 2,
			englishText:
				'"Dear child, always be good and kind, and I will watch over you from heaven," she said.',
			vietnameseText:
				'"Con yêu, hãy luôn ngoan và tốt bụng, mẹ sẽ dõi theo con từ trên trời," bà nói.',
			startTimestamp: 6.5,
			endTimestamp: 14.2,
		},
		{
			id: "s-3",
			storyId: "11111111-1111-1111-1111-111111111111",
			sequence: 3,
			englishText:
				"Soon afterwards she closed her eyes and died, and the girl visited her grave every day.",
			vietnameseText:
				"Không lâu sau bà nhắm mắt qua đời, và ngày nào cô bé cũng ra thăm mộ mẹ.",
			startTimestamp: 14.2,
			endTimestamp: 21.0,
		},
		{
			id: "s-4",
			storyId: "11111111-1111-1111-1111-111111111111",
			sequence: 4,
			englishText:
				"The next year, her father married a woman who had two daughters of her own.",
			vietnameseText:
				"Năm sau, cha cô lấy một người phụ nữ có hai cô con gái riêng.",
			startTimestamp: 21.0,
			endTimestamp: 27.5,
		},
		{
			id: "s-5",
			storyId: "11111111-1111-1111-1111-111111111111",
			sequence: 5,
			englishText:
				"The sisters had pretty faces, but their hearts were cold and cruel.",
			vietnameseText:
				"Hai người chị có gương mặt xinh đẹp nhưng trái tim lại lạnh lùng và tàn nhẫn.",
			startTimestamp: 27.5,
			endTimestamp: 34.0,
		},
		{
			id: "s-6",
			storyId: "11111111-1111-1111-1111-111111111111",
			sequence: 6,
			englishText:
				"They took away her fine clothes, dressed her in an old grey frock, and gave her wooden shoes.",
			vietnameseText:
				"Họ lấy đi những bộ quần áo đẹp của cô, bắt cô mặc một chiếc áo xám cũ kỹ và đi giày gỗ.",
			startTimestamp: 34.0,
			endTimestamp: 42.0,
		},
		{
			id: "s-7",
			storyId: "11111111-1111-1111-1111-111111111111",
			sequence: 7,
			englishText:
				"She had to work hard from morning till night, get up before daybreak, carry water, and sweep the hearth.",
			vietnameseText:
				"Cô phải làm việc vất vả từ sáng sớm đến tối mịt, dậy trước lúc bình minh, gánh nước và dọn bếp lò.",
			startTimestamp: 42.0,
			endTimestamp: 51.0,
		},
		{
			id: "s-8",
			storyId: "11111111-1111-1111-1111-111111111111",
			sequence: 8,
			englishText:
				"Because she was always dusty and dirty from the ashes, everyone called her Cinderella.",
			vietnameseText:
				"Vì cô lúc nào cũng lấm lem tro bụi, mọi người đều gọi cô là Lọ Lem.",
			startTimestamp: 51.0,
			endTimestamp: 60.0,
		},
	],
};

export const Route = createFileRoute("/_app/stories/$slug")({
	component: StoryDetailPage,
});

function StoryDetailPage() {
	const { slug } = Route.useParams();

	// Load story detail from mock or fallback to Cinderella
	const story: StoryReaderHeaderItem = useMemo(() => {
		if (slug === "cinderella") return MOCK_CINDERELLA_DETAIL;
		return {
			...MOCK_CINDERELLA_DETAIL,
			slug,
			title: slug
				.split("-")
				.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
				.join(" "),
		};
	}, [slug]);

	useBreadcrumbs([
		{ label: m["stories.title"](), to: APP_ROUTES.STORIES.LIST },
		{ label: story.title },
	]);

	const [mode, setMode] = useState<"listen" | "read">("listen");
	const [showTranslation, setShowTranslation] = useState<boolean>(true);
	const [saved, setSaved] = useState<boolean>(Boolean(story.saved));
	const [bookmarkCount, setBookmarkCount] = useState<number>(
		story.bookmarks ?? 31,
	);
	const [currentTime, setCurrentTime] = useState<number>(0);

	function handleToggleSave() {
		setSaved((prev) => {
			const next = !prev;
			setBookmarkCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
			return next;
		});
	}

	function handleSentenceClick(startTimestamp: number) {
		setCurrentTime(startTimestamp);
	}

	return (
		<div className="flex min-h-screen flex-col bg-background pb-28">
			{/* Top sticky header */}
			<StoryReaderHeader
				story={story}
				mode={mode}
				onModeChange={setMode}
				showTranslation={showTranslation}
				onToggleTranslation={() => setShowTranslation((v) => !v)}
				saved={saved}
				bookmarkCount={bookmarkCount}
				onToggleSave={handleToggleSave}
			/>

			{/* Main Split Layout: Left illustration, Right scrollable sentences */}
			<main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-4 md:flex-row md:p-6">
				{/* Left Column: Image & Disclaimer */}
				<div className="flex flex-col gap-3 md:w-5/12 lg:w-1/2">
					<div className="overflow-hidden rounded-2xl border-2 border-border/80 bg-muted/40 shadow-sm">
						{story.thumbnailUrl ? (
							<img
								src={story.thumbnailUrl}
								alt={story.title}
								className="aspect-[4/3] w-full object-cover"
							/>
						) : null}
					</div>

					<p className="text-[11px] leading-relaxed text-muted-foreground/80 italic">
						{m["stories.reader.disclaimer"]()}
					</p>
				</div>

				{/* Right Column: Story Text and Sentences */}
				<div className="flex flex-1 flex-col md:w-7/12 lg:w-1/2">
					<TextActionDock source={{ type: "story", id: story.id }}>
						<div className="flex flex-col gap-5 py-1">
							{story.sentences.map((sent) => {
								if (!sent) return null;
								const isActive =
									mode === "listen" &&
									currentTime >= sent.startTimestamp &&
									currentTime < sent.endTimestamp;

								return (
									<button
										type="button"
										key={sent.id}
										onClick={() => handleSentenceClick(sent.startTimestamp)}
										className={cn(
											"group relative w-full cursor-pointer rounded-xl p-3 text-left transition-colors",
											isActive
												? "border-l-4 border-primary bg-primary/10 shadow-xs"
												: "hover:bg-muted/50",
										)}
									>
										{/* English Text */}
										<div className="flex items-start justify-between gap-3">
											<p
												className={cn(
													"font-medium leading-relaxed transition-colors",
													isActive
														? "font-semibold text-foreground text-lg"
														: "text-foreground/90 text-base",
												)}
											>
												{sent.englishText}
											</p>
											<span
												className="mt-1 flex shrink-0 items-center justify-center rounded-full p-1 text-muted-foreground/60 transition-colors group-hover:text-primary"
												aria-hidden="true"
											>
												<Volume2 className="size-4" />
											</span>
										</div>

										{/* Vietnamese Translation */}
										{showTranslation ? (
											<p className="mt-1.5 text-muted-foreground text-sm leading-normal italic">
												{sent.vietnameseText}
											</p>
										) : null}
									</button>
								);
							})}
						</div>
					</TextActionDock>
				</div>
			</main>

			{/* Bottom Audio Player bar: only in Listen & Read mode */}
			{mode === "listen" ? (
				<StoryAudioPlayer
					audioUrl={story.audioUrl}
					fallbackDuration={story.duration}
					currentTime={currentTime}
					onTimeUpdate={setCurrentTime}
					onSeek={setCurrentTime}
				/>
			) : null}
		</div>
	);
}
