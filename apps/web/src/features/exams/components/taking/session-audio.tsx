import type { ExamTakingContent } from "@engflex/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { m } from "#/paraglide/messages";

type AudioRange = NonNullable<
	ExamTakingContent["parts"][number]["items"][number]["itemAudio"]
>;

export function SessionAudio({
	src,
	range,
	speed,
	onPlay,
}: {
	src: string | null;
	range: AudioRange;
	speed: number;
	onPlay: (audio: HTMLAudioElement) => void;
}) {
	const ref = useRef<HTMLAudioElement>(null);
	const [failed, setFailed] = useState(false);
	const { startTime: start, endTime: end } = range;
	const attachAudio = useCallback(
		(audio: HTMLAudioElement | null) => {
			ref.current = audio;
			if (!audio || start === null || end === null) return;
			// Media events can fire before React hydrates. Read the existing DOM
			// state as well as listening for subsequent metadata/error events.
			if (
				audio.error ||
				(audio.readyState >= 1 &&
					(!Number.isFinite(audio.duration) ||
						start >= audio.duration ||
						end > audio.duration + 0.5))
			) {
				audio.pause();
				setFailed(true);
				return;
			}
			if (
				audio.readyState >= 1 &&
				(audio.currentTime < start || audio.currentTime > end)
			)
				audio.currentTime = start;
			audio.playbackRate = speed;
		},
		[start, end, speed],
	);
	useEffect(() => {
		const audio = ref.current;
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
		return <p role="alert">{m["exams.toeic.take.mediaFailed"]()}</p>;
	}
	return (
		// biome-ignore lint/a11y/useMediaCaption: taking content intentionally excludes transcripts.
		<audio
			ref={attachAudio}
			src={src}
			controls
			preload="metadata"
			className="w-full"
			aria-label={m["exams.toeic.take.audio"]()}
			onLoadedMetadata={(event) => {
				attachAudio(event.currentTarget);
			}}
			onPlay={(event) => {
				const audio = event.currentTarget;
				if (audio.currentTime < start || audio.currentTime >= end)
					audio.currentTime = start;
				onPlay(audio);
			}}
			onSeeking={(event) => {
				const audio = event.currentTarget;
				if (audio.currentTime < start || audio.currentTime > end)
					audio.currentTime = Math.min(end, Math.max(start, audio.currentTime));
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
	);
}
