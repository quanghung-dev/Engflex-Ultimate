import { m } from "#/paraglide/messages";

export interface ToeicConfigPanelProps {
	selectedMode: "exam" | "practice";
	selectedParts: number[];
	onSelectMode?: (mode: "exam" | "practice") => void;
	onTogglePart?: (partNumber: number) => void;
	onSelectAll?: () => void;
	onDeselectAll?: () => void;
	onStartTest?: () => void;
}

const LISTENING_PARTS = [
	{ num: 1, label: "P1 — Photos (6)" },
	{ num: 2, label: "P2 — Question-Response (25)" },
	{ num: 3, label: "P3 — Conversations (39)" },
	{ num: 4, label: "P4 — Talks (30)" },
];

const READING_PARTS = [
	{ num: 5, label: "P5 — Incomplete Sentences (30)" },
	{ num: 6, label: "P6 — Text Completion (16)" },
	{ num: 7, label: "P7 — Reading Comprehension (54)" },
];

export function ToeicConfigPanel({
	selectedMode = "exam",
	selectedParts = [1, 2, 3, 4, 5, 6, 7],
	onSelectMode,
	onTogglePart,
	onSelectAll,
	onDeselectAll,
	onStartTest,
}: ToeicConfigPanelProps) {
	return (
		<div className="flex flex-col gap-6 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-6">
			{/* Mode Selection */}
			<div className="flex flex-col gap-2.5">
				<h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
					{m["exams.toeic.test.config.modeTitle"]()}
				</h3>
				<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
					<button
						type="button"
						onClick={() => onSelectMode?.("exam")}
						className={`flex flex-col items-start rounded-xl p-3.5 text-left transition-all ${
							selectedMode === "exam"
								? "border-2 border-foreground/90 bg-muted/20 shadow-sm"
								: "border border-border/80 hover:bg-muted/30"
						}`}
					>
						<span className="text-sm font-bold text-foreground">
							{m["exams.toeic.test.config.examModeTitle"]()}
						</span>
						<span className="mt-1 text-xs text-muted-foreground">
							{m["exams.toeic.test.config.examModeDesc"]()}
						</span>
					</button>

					<button
						type="button"
						onClick={() => onSelectMode?.("practice")}
						className={`flex flex-col items-start rounded-xl p-3.5 text-left transition-all ${
							selectedMode === "practice"
								? "border-2 border-foreground/90 bg-muted/20 shadow-sm"
								: "border border-border/80 hover:bg-muted/30"
						}`}
					>
						<span className="text-sm font-bold text-foreground">
							{m["exams.toeic.test.config.practiceModeTitle"]()}
						</span>
						<span className="mt-1 text-xs text-muted-foreground">
							{m["exams.toeic.test.config.practiceModeDesc"]()}
						</span>
					</button>
				</div>
			</div>

			{/* Parts Selection */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-bold text-foreground">
						{m["exams.toeic.test.config.partsSelectionTitle"]()}
					</h3>
					<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
						<button
							type="button"
							onClick={onSelectAll}
							className="transition-colors hover:text-foreground"
						>
							{m["exams.toeic.test.config.selectAll"]()}
						</button>
						<span>•</span>
						<button
							type="button"
							onClick={onDeselectAll}
							className="transition-colors hover:text-foreground"
						>
							{m["exams.toeic.test.config.deselectAll"]()}
						</button>
					</div>
				</div>

				{/* LISTENING group */}
				<div className="flex flex-col gap-2">
					<span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
						{m["exams.toeic.test.breakdown.listening"]()}
					</span>
					<div className="flex flex-col gap-2">
						{LISTENING_PARTS.map((p) => {
							const checked = selectedParts.includes(p.num);
							return (
								<label
									key={p.num}
									className="flex cursor-pointer items-center gap-2.5 text-xs text-foreground select-none"
								>
									<input
										type="checkbox"
										checked={checked}
										onChange={() => onTogglePart?.(p.num)}
										className="size-4 rounded border-border text-primary accent-primary"
									/>
									<span>{p.label}</span>
								</label>
							);
						})}
					</div>
				</div>

				{/* READING group */}
				<div className="flex flex-col gap-2 pt-1">
					<span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
						{m["exams.toeic.test.breakdown.reading"]()}
					</span>
					<div className="flex flex-col gap-2">
						{READING_PARTS.map((p) => {
							const checked = selectedParts.includes(p.num);
							return (
								<label
									key={p.num}
									className="flex cursor-pointer items-center gap-2.5 text-xs text-foreground select-none"
								>
									<input
										type="checkbox"
										checked={checked}
										onChange={() => onTogglePart?.(p.num)}
										className="size-4 rounded border-border text-primary accent-primary"
									/>
									<span>{p.label}</span>
								</label>
							);
						})}
					</div>
				</div>
			</div>

			{/* Summary bar */}
			<div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-center text-xs font-semibold text-foreground md:text-sm">
				{m["exams.toeic.test.config.summary"]({
					parts: selectedParts.length,
					questions: 200,
					duration: 120,
				})}
			</div>

			{/* Auto-submit note */}
			<p className="whitespace-pre-line text-center text-xs text-muted-foreground">
				{m["exams.toeic.test.config.autoSubmitNote"]()}
			</p>

			{/* Action Button */}
			<button
				type="button"
				onClick={onStartTest}
				className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 md:text-base cursor-pointer"
			>
				{m["exams.toeic.test.config.startButton"]()}
			</button>
		</div>
	);
}
