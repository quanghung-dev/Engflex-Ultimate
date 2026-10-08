import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageLayout } from "#/components/common/page-layout";
import { AudioCalibrationBanner } from "#/features/voice/components/mode/audio-calibration-banner";
import { ModeCard } from "#/features/voice/components/mode/mode-card";
import { MODE_CARDS } from "#/features/voice/fixtures";
import { useCreateConversation } from "#/features/voice/queries";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/voice/")({
	component: VoiceModesPage,
});

function VoiceModesPage() {
	useBreadcrumbs([{ label: m["nav.item.voice"]() }]);
	const navigate = useNavigate();
	const createConversation = useCreateConversation();

	async function startFreeTalk() {
		if (createConversation.isPending) return;
		try {
			const conversation = await createConversation.mutateAsync({
				mode: "free_talk",
			});
			await navigate({
				to: APP_ROUTES.VOICE.ROOM,
				params: { conversationId: conversation.id },
			});
		} catch {
			toast.error(m["voice.create.failed"]());
		}
	}

	return (
		<PageLayout
			hero={{
				icon: <MoMascot variant="open" size={84} />,
				title: m["voice.modes.title"](),
				description: m["voice.modes.subtitle"](),
			}}
		>
			<div className="grid items-start gap-4 lg:grid-cols-2">
				{MODE_CARDS.map((card) => (
					<ModeCard
						key={card.id}
						card={card}
						onStart={() => {
							if (card.id === "spontaneous") {
								void startFreeTalk();
								return;
							}
							navigate({ to: APP_ROUTES.VOICE.SCENARIOS });
						}}
					/>
				))}
			</div>
			<div
				className="flex items-center gap-3 p-4"
				style={{
					background: "#ffe2c5",
					border: "2px solid var(--border)",
					borderRadius: 24,
					boxShadow: "0 5px 0 var(--border)",
				}}
			>
				<MoMascot variant="nice" size={40} className="hidden sm:inline-flex" />
				<div className="min-w-0">
					<p className="text-[11px] font-bold text-foreground">
						{m["voice.tip.title"]()}
					</p>
					<p className="text-[15px] font-medium text-foreground">
						{m["voice.tip.body"]()}
					</p>
				</div>
			</div>
			<AudioCalibrationBanner />
		</PageLayout>
	);
}
