import type {
	CEFR,
	VideoCategoryResponse,
	VideoExerciseResponse,
	VideoTranscriptResponse,
} from "@engflex/contracts";
import { useStore } from "@tanstack/react-store";
import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	cefrColumn,
	cefrOptions,
	dateColumn,
	fromNone,
	textColumn,
	titleColumn,
	withNone,
} from "#/features/admin/components/columns";
import { NONE } from "#/features/admin/components/resource-form-dialog";
import {
	type ResourceConfig,
	ResourcePanel,
} from "#/features/admin/components/resource-panel";
import { ADMIN_TODAY } from "#/features/admin/fixtures";
import { formatDuration, slugify } from "#/features/admin/format";
import {
	adminStore,
	newAdminId,
	removeRow,
	saveRow,
} from "#/features/admin/store";
import { m } from "#/paraglide/messages";

/* --------------------------------------------------------- exercises */

type ExerciseForm = {
	title: string;
	categoryId: string;
	cefrLevel: string;
	duration: number;
	videoUrl: string;
	thumbnailUrl: string;
	description: string;
};

function exerciseConfig(
	categories: VideoCategoryResponse[],
	segmentCount: (videoId: string) => number,
): ResourceConfig<VideoExerciseResponse, ExerciseForm> {
	const categoryName = (id: string | undefined) =>
		categories.find((category) => category.id === id)?.name;
	return {
		noun: () => m["admin.videos.exercises.noun"](),
		columns: [
			titleColumn(
				"title",
				() => m["admin.fields.title"](),
				(video) => video.title,
				(video) => video.description,
			),
			textColumn(
				"category",
				() => m["admin.fields.category"](),
				(video) => categoryName(video.categoryId),
			),
			cefrColumn((video) => video.cefrLevel),
			{
				id: "duration",
				header: () => m["admin.fields.duration"](),
				accessorFn: (video) => video.duration,
				enableGlobalFilter: false,
				cell: ({ row }) => (
					<span className="text-muted-foreground tabular-nums">
						{formatDuration(row.original.duration)}
					</span>
				),
			},
			{
				id: "segments",
				header: () => m["admin.fields.segments"](),
				accessorFn: (video) => segmentCount(video.id),
				enableGlobalFilter: false,
				cell: ({ getValue }) => (
					<span className="text-muted-foreground tabular-nums">
						{String(getValue())}
					</span>
				),
			},
		],
		fields: [
			{
				name: "title",
				label: () => m["admin.fields.title"](),
				kind: "text",
				required: true,
				full: true,
			},
			{
				name: "categoryId",
				label: () => m["admin.fields.category"](),
				kind: "select",
				options: () =>
					withNone(
						categories.map((category) => ({
							value: category.id,
							label: category.name,
						})),
					),
			},
			{
				name: "cefrLevel",
				label: () => m["admin.fields.cefr"](),
				kind: "select",
				options: () => withNone(cefrOptions()),
			},
			{
				name: "videoUrl",
				label: () => m["admin.fields.videoUrl"](),
				kind: "text",
				required: true,
				full: true,
			},
			{
				name: "thumbnailUrl",
				label: () => m["admin.fields.thumbnailUrl"](),
				kind: "text",
			},
			{
				name: "duration",
				label: () => m["admin.fields.durationSeconds"](),
				kind: "number",
			},
			{
				name: "description",
				label: () => m["admin.fields.description"](),
				kind: "textarea",
			},
		],
		blank: () => ({
			title: "",
			categoryId: NONE,
			cefrLevel: NONE,
			duration: 0,
			videoUrl: "",
			thumbnailUrl: "",
			description: "",
		}),
		toForm: (video) => ({
			title: video.title,
			categoryId: video.categoryId ?? NONE,
			cefrLevel: video.cefrLevel ?? NONE,
			duration: video.duration,
			videoUrl: video.videoUrl,
			thumbnailUrl: video.thumbnailUrl,
			description: video.description,
		}),
		fromForm: (values, video) => ({
			createdAt: ADMIN_TODAY,
			...video,
			id: video?.id ?? newAdminId("video"),
			title: values.title.trim(),
			categoryId: fromNone(values.categoryId),
			cefrLevel: fromNone(values.cefrLevel) as CEFR | undefined,
			duration: values.duration,
			videoUrl: values.videoUrl.trim(),
			thumbnailUrl: values.thumbnailUrl.trim(),
			description: values.description.trim(),
			updatedAt: ADMIN_TODAY,
		}),
		label: (video) => video.title,
	};
}

export function VideoExercisesPanel() {
	const rows = useStore(adminStore, (state) => state.videoExercises);
	const categories = useStore(adminStore, (state) => state.videoCategories);
	const transcripts = useStore(adminStore, (state) => state.videoTranscripts);
	const segmentCount = (videoId: string) =>
		transcripts.filter((segment) => segment.videoExerciseId === videoId).length;
	return (
		<ResourcePanel
			config={exerciseConfig(categories, segmentCount)}
			rows={rows}
			onSave={(row) => saveRow("videoExercises", row)}
			onDelete={(row) => removeRow("videoExercises", row.id)}
		/>
	);
}

/* ------------------------------------------------------- transcripts */

type SegmentForm = {
	sequence: number;
	startTimestamp: number;
	endTimestamp: number;
	content: string;
	vietnamese: string;
	phonetic: string;
};

function segmentConfig(
	videoId: string,
	nextSequence: number,
): ResourceConfig<VideoTranscriptResponse, SegmentForm> {
	return {
		noun: () => m["admin.videos.transcripts.noun"](),
		columns: [
			{
				id: "sequence",
				header: () => m["admin.fields.sequence"](),
				accessorFn: (segment) => segment.sequence,
				enableGlobalFilter: false,
				cell: ({ getValue }) => (
					<span className="font-semibold tabular-nums">
						{String(getValue())}
					</span>
				),
			},
			titleColumn(
				"content",
				() => m["admin.fields.content"](),
				(segment) => segment.content,
				(segment) => segment.vietnamese,
			),
			{
				id: "timing",
				header: () => m["admin.fields.timing"](),
				accessorFn: (segment) => segment.startTimestamp,
				enableGlobalFilter: false,
				cell: ({ row }) => (
					<span className="whitespace-nowrap text-muted-foreground tabular-nums">
						{formatDuration(row.original.startTimestamp)} –{" "}
						{formatDuration(row.original.endTimestamp)}
					</span>
				),
			},
		],
		fields: [
			{
				name: "sequence",
				label: () => m["admin.fields.sequence"](),
				kind: "number",
				full: true,
			},
			{
				name: "startTimestamp",
				label: () => m["admin.fields.startSeconds"](),
				kind: "number",
			},
			{
				name: "endTimestamp",
				label: () => m["admin.fields.endSeconds"](),
				kind: "number",
			},
			{
				name: "content",
				label: () => m["admin.fields.content"](),
				kind: "textarea",
				required: true,
			},
			{
				name: "vietnamese",
				label: () => m["admin.fields.vietnamese"](),
				kind: "textarea",
			},
			{
				name: "phonetic",
				label: () => m["admin.fields.phonetic"](),
				kind: "text",
				full: true,
			},
		],
		blank: () => ({
			sequence: nextSequence,
			startTimestamp: 0,
			endTimestamp: 0,
			content: "",
			vietnamese: "",
			phonetic: "",
		}),
		toForm: (segment) => ({
			sequence: segment.sequence,
			startTimestamp: segment.startTimestamp,
			endTimestamp: segment.endTimestamp,
			content: segment.content,
			vietnamese: segment.vietnamese,
			phonetic: segment.phonetic,
		}),
		fromForm: (values, segment) => ({
			createdAt: ADMIN_TODAY,
			...segment,
			id: segment?.id ?? newAdminId("seg"),
			videoExerciseId: segment?.videoExerciseId ?? videoId,
			sequence: Math.round(values.sequence),
			startTimestamp: values.startTimestamp,
			endTimestamp: values.endTimestamp,
			content: values.content.trim(),
			vietnamese: values.vietnamese.trim(),
			phonetic: values.phonetic.trim(),
			updatedAt: ADMIN_TODAY,
		}),
		label: (segment) => `#${segment.sequence}`,
	};
}

export function VideoTranscriptsPanel() {
	const videos = useStore(adminStore, (state) => state.videoExercises);
	const transcripts = useStore(adminStore, (state) => state.videoTranscripts);
	const [picked, setPicked] = useState<string | undefined>(undefined);
	// Fall back to the first video, including after the picked one is deleted.
	const videoId = videos.some((video) => video.id === picked)
		? picked
		: videos[0]?.id;

	const rows = transcripts
		.filter((segment) => segment.videoExerciseId === videoId)
		.sort((a, b) => a.sequence - b.sequence);
	const nextSequence = (rows.at(-1)?.sequence ?? 0) + 1;

	if (!videoId) {
		return (
			<p className="surface-card p-6 text-sm text-muted-foreground">
				{m["admin.videos.transcripts.noVideos"]()}
			</p>
		);
	}

	return (
		<ResourcePanel
			config={segmentConfig(videoId, nextSequence)}
			rows={rows}
			onSave={(row) => saveRow("videoTranscripts", row)}
			onDelete={(row) => removeRow("videoTranscripts", row.id)}
			toolbar={
				<Select value={videoId} onValueChange={setPicked}>
					<SelectTrigger
						className="w-64"
						aria-label={m["admin.videos.transcripts.videoFilter"]()}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{videos.map((video) => (
							<SelectItem key={video.id} value={video.id}>
								{video.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			}
		/>
	);
}

/* -------------------------------------------------------- categories */

type CategoryForm = { name: string; slug: string };

const CATEGORY_CONFIG: ResourceConfig<VideoCategoryResponse, CategoryForm> = {
	noun: () => m["admin.videos.categories.noun"](),
	columns: [
		titleColumn(
			"name",
			() => m["admin.fields.name"](),
			(category) => category.name,
		),
		textColumn(
			"slug",
			() => m["admin.fields.slug"](),
			(c) => c.slug,
		),
		dateColumn(
			"updated",
			() => m["admin.fields.updated"](),
			(c) => c.updatedAt,
		),
	],
	fields: [
		{
			name: "name",
			label: () => m["admin.fields.name"](),
			kind: "text",
			required: true,
		},
		{ name: "slug", label: () => m["admin.fields.slug"](), kind: "text" },
	],
	blank: () => ({ name: "", slug: "" }),
	toForm: (category) => ({ name: category.name, slug: category.slug }),
	fromForm: (values, category) => ({
		createdAt: ADMIN_TODAY,
		...category,
		id: category?.id ?? newAdminId("vidcat"),
		name: values.name.trim(),
		slug: slugify(values.slug || values.name),
		updatedAt: ADMIN_TODAY,
	}),
	label: (category) => category.name,
};

export function VideoCategoriesPanel() {
	const rows = useStore(adminStore, (state) => state.videoCategories);
	return (
		<ResourcePanel
			config={CATEGORY_CONFIG}
			rows={rows}
			onSave={(row) => saveRow("videoCategories", row)}
			onDelete={(row) => removeRow("videoCategories", row.id)}
		/>
	);
}
