import {
	Activity,
	ArrowRight,
	Compass,
	TrendingUp,
	Trophy,
	Zap,
} from "lucide-react";
import { m } from "#/paraglide/messages";

export interface ToeicStats {
	completedTests: number;
	highestScore: number;
	averageScore: number;
	latestScore: number;
}

export function ToeicStatsPanel({ stats }: { stats: ToeicStats }) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-base font-bold text-foreground">
					<TrendingUp className="size-5 text-emerald-600" aria-hidden="true" />
					<span>{m["exams.toeic.hub.analytics.title"]()}</span>
				</div>
				<button
					type="button"
					className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
				>
					<span>{m["exams.toeic.hub.analytics.viewAll"]()}</span>
					<ArrowRight className="size-3.5" aria-hidden="true" />
				</button>
			</div>

			<div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm md:p-5">
				<div className="grid grid-cols-2 gap-3 md:gap-4">
					{/* Completed Tests */}
					<div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 dark:border-sky-900/40 dark:bg-sky-950/20 md:p-4">
						<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
							<span className="flex size-6 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-400">
								<Compass className="size-3.5" aria-hidden="true" />
							</span>
							<span className="truncate">
								{m["exams.toeic.hub.analytics.completedTests"]()}
							</span>
						</div>
						<div className="text-2xl font-bold text-sky-600 md:text-3xl">
							{stats.completedTests}
						</div>
					</div>

					{/* Highest Score */}
					<div className="flex flex-col gap-2 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20 md:p-4">
						<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
							<span className="flex size-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400">
								<Trophy className="size-3.5" aria-hidden="true" />
							</span>
							<span className="truncate">
								{m["exams.toeic.hub.analytics.highestScore"]()}
							</span>
						</div>
						<div className="text-2xl font-bold text-amber-500 md:text-3xl">
							{stats.highestScore}
						</div>
					</div>

					{/* Average Score */}
					<div className="flex flex-col gap-2 rounded-xl border border-purple-100 bg-purple-50/70 p-3.5 dark:border-purple-900/40 dark:bg-purple-950/20 md:p-4">
						<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
							<span className="flex size-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-400">
								<Activity className="size-3.5" aria-hidden="true" />
							</span>
							<span className="truncate">
								{m["exams.toeic.hub.analytics.averageScore"]()}
							</span>
						</div>
						<div className="text-2xl font-bold text-purple-600 md:text-3xl">
							{stats.averageScore}
						</div>
					</div>

					{/* Latest Score */}
					<div className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20 md:p-4">
						<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
							<span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400">
								<Zap className="size-3.5" aria-hidden="true" />
							</span>
							<span className="truncate">
								{m["exams.toeic.hub.analytics.latestScore"]()}
							</span>
						</div>
						<div className="text-2xl font-bold text-emerald-600 md:text-3xl">
							{stats.latestScore}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
