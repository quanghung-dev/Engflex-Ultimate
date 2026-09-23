import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb, voiceRoomCrumbLabel } from "#/app/breadcrumbs";
import { ScrollArea } from "#/components/ui/scroll-area";
import { AnalyzeTurnButton } from "#/features/voice/components/analyze-turn-button";
import { MicControls } from "#/features/voice/components/mic-controls";
import { SceneHeader } from "#/features/voice/components/scene-header";
import { SessionTimerPill } from "#/features/voice/components/session-timer-pill";
import { TranscriptBubble } from "#/features/voice/components/transcript-bubble";
import { TranscriptHeader } from "#/features/voice/components/transcript-header";
import { TurnDiagnosticsCard } from "#/features/voice/components/turn-diagnostics-card";
import { VoicePulse } from "#/features/voice/components/voice-pulse";
import { getScenario } from "#/features/voice/fixtures";
import {
	advanceSession,
	currentStreamingText,
	endSession,
	ensureFreshSession,
	markAnalyzed,
	sessionPhase,
	toggleMic,
	voiceSessionStore,
} from "#/features/voice/store";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/voice/room")({
	staticData: breadcrumb([
		{ label: () => m["nav.voice"](), target: { to: APP_ROUTES.VOICE } },
		voiceRoomCrumbLabel,
	]),
	component: LiveStudioPage,
});

function LiveStudioPage() {
	const navigate = useNavigate();
	const state = useStore(voiceSessionStore);
	const [analyzedOnly, setAnalyzedOnly] = useState(false);

	// One interval drives the whole scripted engine.
	useEffect(() => {
		ensureFreshSession();
		const id = window.setInterval(() => advanceSession(40), 40);
		return () => window.clearInterval(id);
	}, []);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.code !== "Space") return;
			const target = event.target as HTMLElement | null;
			if (
				target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable)
			) {
				return;
			}
			event.preventDefault();
			toggleMic();
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const scenario = state.scenarioId ? getScenario(state.scenarioId) : undefined;
	const partnerName =
		scenario?.persona?.name ?? m["voice.room.partnerFallback"]();
	const phase = sessionPhase(state);
	const streaming = currentStreamingText(state);
	const lastUserTurn = [...state.turns]
		.reverse()
		.find((turn) => turn.role === "user");
	const lastUserAnalyzed = lastUserTurn
		? state.analyzedTurnIds.includes(lastUserTurn.id)
		: false;
	const visibleTurns = analyzedOnly
		? state.turns.filter((turn) => state.analyzedTurnIds.includes(turn.id))
		: state.turns;

	function handleEnd() {
		endSession();
		toast(m["common.sessionSavedMock"]());
		navigate({ to: "/voice" });
	}

	return (
		<div className="container-studio flex flex-col gap-4 py-6">
			<div className="grid gap-4 lg:grid-cols-12 h-full">
				<div className="lg:col-span-5 h-full">
					<div className="flex flex-col gap-4 bg-card rounded-xl border p-5 h-full">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<Link to="/voice" className="flex gap-2 items-center text-sm">
								<ArrowLeft size={16} />
								{m["voice.room.back"]()}
							</Link>
							<span className="flex items-center gap-2">
								<SessionTimerPill
									elapsedMs={state.elapsedMs}
									totalSec={state.script.totalSec}
								/>
							</span>
						</div>
						<SceneHeader scenario={scenario} />
						<div className="h-full flex flex-col items-center justify-center gap-4">
							<VoicePulse phase={phase} />
							<MicControls
								micMuted={state.micMuted}
								onToggleMic={toggleMic}
								onEnd={handleEnd}
							/>
							<p className="text-center text-[11px] text-muted-foreground">
								{m["voice.room.spaceHint"]()}
							</p>
						</div>
					</div>
				</div>

				<div className="lg:col-span-7">
					<div className="flex h-full flex-col rounded-xl border bg-card">
						<TranscriptHeader
							analyzedOnly={analyzedOnly}
							onAnalyzedOnlyChange={setAnalyzedOnly}
						/>
						<ScrollArea className="h-[460px]">
							<div className="flex flex-col gap-4 p-4">
								{visibleTurns.map((turn) => {
									const feedback = state.feedbackByTurn[turn.id];
									const isUser = turn.role === "user";
									return (
										<div key={turn.id} className="flex flex-col gap-2">
											<TranscriptBubble
												turn={turn}
												speakerName={
													isUser
														? m["voice.room.speakerYou"]()
														: m["voice.room.speakerPartner"]({
																name: partnerName,
															})
												}
											/>
											{state.analyzedTurnIds.includes(turn.id) && feedback ? (
												<TurnDiagnosticsCard feedback={feedback} />
											) : null}
										</div>
									);
								})}
								{streaming ? (
									<TranscriptBubble
										turn={undefined}
										speakerName={
											phase === "ai-speaking"
												? m["voice.room.speakerPartner"]({ name: partnerName })
												: m["voice.room.speakerYou"]()
										}
										streamingText={streaming}
									/>
								) : null}
								{lastUserTurn && !lastUserAnalyzed ? (
									<div className="flex justify-end">
										<AnalyzeTurnButton
											onAnalyze={() => markAnalyzed(lastUserTurn.id)}
										/>
									</div>
								) : null}
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>
		</div>
	);
}
