import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";

/**
 * Blocking session modal. Every terminal room state (setup error, RTVI
 * error, unexpected disconnect, already-ended conversation) renders through
 * this one component — never an inline swap or redirect. The room stays
 * mounted behind it; leaving ends the conversation.
 */
export function SessionModal({
	open,
	title,
	description,
	actionLabel,
	onAction,
}: {
	open: boolean;
	title: string;
	description: string;
	actionLabel: string;
	onAction: () => void;
}) {
	return (
		<AlertDialog open={open}>
			<AlertDialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogAction onClick={onAction}>
						{actionLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
