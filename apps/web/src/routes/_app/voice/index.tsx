import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { breadcrumb } from "#/app/breadcrumbs";
import { PageHeader } from "#/components/common/page-header";
import { AudioCalibrationBanner } from "#/features/voice/components/audio-calibration-banner";
import { ModeCard } from "#/features/voice/components/mode-card";
import { MODE_CARDS } from "#/features/voice/fixtures";
import { startSession } from "#/features/voice/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/voice/")({
	staticData: breadcrumb(() => m["nav.voice"]()),
	component: VoiceModesPage,
});

function VoiceModesPage() {
	const navigate = useNavigate();

	return (
		<div className="container-detail flex flex-col gap-6 py-8">
			<PageHeader
				title={m["voice.modesTitle"]()}
				subtitle={m["voice.modesSubtitle"]()}
			/>
			<div className="grid gap-4 lg:grid-cols-2">
				{MODE_CARDS.map((card) => (
					<ModeCard
						key={card.id}
						card={card}
						onStart={() => {
							if (card.id === "spontaneous") {
								startSession("free_talk");
								navigate({ to: "/voice/room" });
								return;
							}
							navigate({ to: "/voice/scenarios" });
						}}
					/>
				))}
			</div>
			<AudioCalibrationBanner />
		</div>
	);
}
