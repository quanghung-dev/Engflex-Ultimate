import { SubmitButton } from "#/components/common/submit-button";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { m } from "#/paraglide/messages";

export function SessionConfirmModal({
	action,
	answered,
	total,
	pending,
	error,
	onClose,
	onConfirm,
}: {
	action: "submit" | "cancel" | null;
	answered: number;
	total: number;
	pending: boolean;
	error: boolean;
	onClose: () => void;
	onConfirm: () => void;
}) {
	return (
		<AlertDialog
			open={action !== null}
			onOpenChange={(open) => {
				if (!open && !pending) onClose();
			}}
		>
			<AlertDialogContent className="z-[70]">
				<AlertDialogTitle>
					{action === "submit"
						? m["exams.toeic.take.confirmSubmitTitle"]()
						: m["exams.toeic.take.confirmExitTitle"]()}
				</AlertDialogTitle>
				<AlertDialogDescription>
					{action === "submit"
						? m["exams.toeic.take.confirmSubmitDesc"]({ answered, total })
						: m["exams.toeic.take.confirmExitDesc"]()}
				</AlertDialogDescription>
				{error && (
					<p role="alert" className="text-sm text-destructive">
						{m["exams.toeic.take.saveFailed"]()}
					</p>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={pending} onClick={onClose}>
						{action === "submit"
							? m["exams.toeic.take.confirmSubmitCancel"]()
							: m["exams.toeic.take.confirmExitCancel"]()}
					</AlertDialogCancel>
					<SubmitButton
						pending={pending}
						onClick={onConfirm}
						variant={action === "cancel" ? "destructive" : "default"}
					>
						{action === "submit"
							? m["exams.toeic.take.confirmSubmitAction"]()
							: m["exams.toeic.take.confirmExitAction"]()}
					</SubmitButton>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
