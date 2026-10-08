import { createFileRoute } from "@tanstack/react-router";
import { breadcrumb } from "#/app/breadcrumbs";
import { AdminPage } from "#/features/admin/components/admin-page";
import {
	VideoCategoriesPanel,
	VideoExercisesPanel,
	VideoTranscriptsPanel,
} from "#/features/admin/components/video-panels";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/admin/videos")({
	staticData: breadcrumb(() => m["admin.nav.videos"]()),
	component: AdminVideosPage,
});

function AdminVideosPage() {
	return (
		<AdminPage
			title={m["admin.videos.title"]()}
			subtitle={m["admin.videos.subtitle"]()}
			tabs={[
				{
					value: "exercises",
					label: m["admin.videos.tabs.exercises"](),
					content: <VideoExercisesPanel />,
				},
				{
					value: "transcripts",
					label: m["admin.videos.tabs.transcripts"](),
					content: <VideoTranscriptsPanel />,
				},
				{
					value: "categories",
					label: m["admin.videos.tabs.categories"](),
					content: <VideoCategoriesPanel />,
				},
			]}
		/>
	);
}
