import { useEffect, useRef, useState } from "react";
import type { ReviewAudio } from "#/features/exams/review";
import { m } from "#/paraglide/messages";

export function ToeicReviewAudio({
	src,
	range,
	label,
}: {
	src: string | null;
	range: ReviewAudio;
	label: string;
}) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [failed, setFailed] = useState(false);
	const start = range.startTime;
	const end = range.endTime;
	useEffect(() => {
		const audio = audioRef.current;
		return () => {
			audio?.pause();
		};
	}, []);
	if (
		!src ||
		start === null ||
		end === null ||
		start < 0 ||
		end <= start ||
		failed
	) {
		return (
			<p role="alert" className="text-sm text-muted-foreground">
				{m["exams.toeic.result.review.mediaFailed"]()}
			</p>
		);
	}
	return (
		<div className="flex flex-col gap-2">
			<span className="text-xs font-semibold">{label}</span>
			{/* biome-ignore lint/a11y/useMediaCaption: transcript is rendered alongside the item. */}
			<audio
				ref={(audio) => {
					audioRef.current = audio;
					if (audio?.error) setFailed(true);
					if (audio && audio.readyState >= 1) {
						if (start >= audio.duration) setFailed(true);
						else if (audio.currentTime < start || audio.currentTime > end)
							audio.currentTime = start;
					}
				}}
				src={src}
				controls
				preload="metadata"
				aria-label={label}
				className="w-full"
				onLoadedMetadata={(event) => {
					if (start >= event.currentTarget.duration) {
						setFailed(true);
						return;
					}
					event.currentTarget.currentTime = start;
				}}
				onSeeking={(event) => {
					const audio = event.currentTarget;
					if (audio.currentTime < start || audio.currentTime > end)
						audio.currentTime = Math.min(
							end,
							Math.max(start, audio.currentTime),
						);
				}}
				onPlay={(event) => {
					if (
						event.currentTarget.currentTime < start ||
						event.currentTarget.currentTime >= end
					)
						event.currentTarget.currentTime = start;
				}}
				onTimeUpdate={(event) => {
					if (event.currentTarget.currentTime >= end) {
						event.currentTarget.pause();
						if (event.currentTarget.currentTime > end)
							event.currentTarget.currentTime = end;
					}
				}}
				onError={() => setFailed(true)}
			/>
		</div>
	);
}
