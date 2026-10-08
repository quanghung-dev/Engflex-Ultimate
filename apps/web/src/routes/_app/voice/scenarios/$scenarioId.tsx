import {
	createFileRoute,
	Link,
	Navigate,
	useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { APP_ROUTES } from "#/app/app-route";
import { useBreadcrumbs } from "#/app/breadcrumbs";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageLayout } from "#/components/common/page-layout";
import { Button } from "#/components/ui/button";
import { ScenarioDetailBody } from "#/features/voice/components/scenario-detail/scenario-detail-body";
import { ScenarioDetailHero } from "#/features/voice/components/scenario-detail/scenario-detail-hero";
import { ScenarioDetailSide } from "#/features/voice/components/scenario-detail/scenario-detail-side";
import { useCreateConversation, useScenario } from "#/features/voice/queries";
import { ApiError } from "#/lib/api";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/voice/scenarios/$scenarioId")({
	component: ScenarioDetailPage,
});

/** Server-driven detail: badges, partner, and content come from the API. */
function ScenarioDetailPage() {
	useBreadcrumbs([
		{ label: m["nav.item.voice"](), to: APP_ROUTES.VOICE.LIST },
		{ label: m["voice.crumb.scenarios"](), to: APP_ROUTES.VOICE.SCENARIOS },
		{ label: m["voice.crumb.detail"]() },
	]);
	const { scenarioId } = Route.useParams();
	const navigate = useNavigate();
	const scenarioQuery = useScenario(scenarioId);
	const createConversation = useCreateConversation();

	async function startRoleplay(id: string) {
		if (createConversation.isPending) return;
		try {
			const conversation = await createConversation.mutateAsync({
				mode: "roleplay",
				scenarioId: id,
			});
			await navigate({
				to: APP_ROUTES.VOICE.ROOM,
				params: { conversationId: conversation.id },
			});
		} catch {
			toast.error(m["voice.create.failed"]());
		}
	}

	if (scenarioQuery.isPending) {
		return (
			<PageLayout
				hero={{
					icon: <MoMascot variant="thinking" size={64} />,
					title: m["voice.detail.loading"](),
					description: "",
				}}
			>
				<div />
			</PageLayout>
		);
	}

	if (scenarioQuery.isError) {
		if (
			scenarioQuery.error instanceof ApiError &&
			scenarioQuery.error.status === 404
		) {
			return <Navigate to={APP_ROUTES.VOICE.SCENARIOS} />;
		}
		throw scenarioQuery.error;
	}

	const scenario = scenarioQuery.data;
	return (
		<PageLayout>
			<Button asChild variant="ghost" className="w-fit">
				<Link to={APP_ROUTES.VOICE.SCENARIOS}>
					<ArrowLeft data-icon="inline-start" />
					{m["voice.detail.back"]()}
				</Link>
			</Button>
			<ScenarioDetailHero
				scenario={scenario}
				onStart={() => {
					void startRoleplay(scenario.id);
				}}
			/>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				<div className="lg:col-span-7">
					<ScenarioDetailBody scenario={scenario} />
				</div>
				<div className="lg:col-span-5">
					<ScenarioDetailSide scenario={scenario} />
				</div>
			</div>
		</PageLayout>
	);
}
