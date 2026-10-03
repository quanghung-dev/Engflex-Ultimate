import { useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb } from "#/app/breadcrumbs";
import { MoMascot } from "#/components/common/mo-mascot";
import { PageLayout } from "#/components/common/page-layout";
import { StatCard } from "#/components/common/stat-card";
import { PROGRESS_SUMMARY, SEQUENCE_CARDS } from "#/features/attempts/fixtures";
import { ActiveLessonCard } from "#/features/dashboard/components/active-lesson-card";
import { LiveVoicePartnerCard } from "#/features/dashboard/components/live-voice-partner-card";
import { SequenceCard } from "#/features/dashboard/components/sequence-card";
import { HIGH_FRICTION_COUNT } from "#/features/dashboard/fixtures";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/")({
	staticData: breadcrumb([
		{ label: () => m["nav.item.home"](), target: { to: APP_ROUTES.HOME } },
		() => m["nav.group.practice"](),
	]),
	component: DashboardPage,
});

function DashboardPage() {
	const { user } = useUser();
	const firstName = user?.firstName;

	return (
		<PageLayout
			hero={{
				icon: <MoMascot variant="wave" size={84} />,
				title: firstName
					? m["dashboard.hero.greetingName"]({ name: firstName })
					: m["dashboard.hero.greeting"](),
				description: m["dashboard.hero.subtitle"](),
			}}
		>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label={m["dashboard.stats.fluency"]()}
					value={`${PROGRESS_SUMMARY.fluencyPct}%`}
					ringValue={PROGRESS_SUMMARY.fluencyPct}
					tone="primary"
				/>
				<StatCard
					label={m["dashboard.stats.pronunciation"]()}
					value={`${PROGRESS_SUMMARY.pronunciationPct}%`}
					ringValue={PROGRESS_SUMMARY.pronunciationPct}
					tone="accuracy"
				/>
				<StatCard
					label={m["dashboard.stats.speed"]()}
					value={
						<span>
							{PROGRESS_SUMMARY.wpm}{" "}
							<span className="text-sm font-medium text-muted-foreground">
								{m["dashboard.stats.speedUnit"]()}
							</span>
						</span>
					}
					icon={Gauge}
					tone="violet"
				/>
				<StatCard
					label={m["dashboard.stats.reviewQueue"]()}
					value={PROGRESS_SUMMARY.dueVocabulary}
					footer={
						<span className="flex items-center gap-1">
							<span className="font-semibold text-ai-coral">
								{m["dashboard.stats.highFriction"]({
									count: HIGH_FRICTION_COUNT,
								})}
							</span>
							<span aria-hidden="true">·</span>
							<Link to={APP_ROUTES.VOCABULARY.LIST} className="font-medium">
								{m["dashboard.stats.practice"]()}
							</Link>
						</span>
					}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-12">
				<div className="lg:col-span-7">
					<ActiveLessonCard />
				</div>
				<div className="lg:col-span-5">
					<LiveVoicePartnerCard />
				</div>
			</div>

			<section className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2 className="text-lg font-bold tracking-tight text-foreground">
						{m["dashboard.sequence.title"]()}
					</h2>
					<span className="text-xs text-muted-foreground">
						{m["dashboard.sequence.meta"]({ count: SEQUENCE_CARDS.length })}
					</span>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{SEQUENCE_CARDS.map((card) => (
						<SequenceCard key={card.id} card={card} />
					))}
				</div>
			</section>
		</PageLayout>
	);
}
