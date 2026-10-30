import { m } from "#/paraglide/messages";

export function ConfirmSubmitModal({
	isOpen,
	answeredCount,
	totalCount,
	onClose,
	onConfirm,
}: {
	isOpen: boolean;
	answeredCount: number;
	totalCount: number;
	onClose: () => void;
	onConfirm: () => void;
}) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
			<div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
				<h3 className="text-lg font-bold text-card-foreground">
					{m["exams.toeic.take.confirmSubmitTitle"]()}
				</h3>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{m["exams.toeic.take.confirmSubmitDesc"]({
						answered: answeredCount,
						total: totalCount,
					})}
				</p>
				<div className="flex items-center justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
					>
						{m["exams.toeic.take.confirmSubmitCancel"]()}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
					>
						{m["exams.toeic.take.confirmSubmitAction"]()}
					</button>
				</div>
			</div>
		</div>
	);
}

export function ConfirmExitModal({
	isOpen,
	onClose,
	onConfirm,
}: {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
			<div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
				<h3 className="text-lg font-bold text-card-foreground">
					{m["exams.toeic.take.confirmExitTitle"]()}
				</h3>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{m["exams.toeic.take.confirmExitDesc"]()}
				</p>
				<div className="flex items-center justify-end gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
					>
						{m["exams.toeic.take.confirmExitCancel"]()}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-rose-700"
					>
						{m["exams.toeic.take.confirmExitAction"]()}
					</button>
				</div>
			</div>
		</div>
	);
}
