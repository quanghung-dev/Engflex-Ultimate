import type { VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import type * as React from "react";
import { Button, type buttonVariants } from "#/components/ui/button";

/** Icon-only sizes have no label, so the spinner takes the icon's place.
 *  For every other size the spinner is prepended and the label stays —
 *  width is unchanged and the accessible name survives. */
const ICON_SIZE = /^icon(-|$)/;

/** The house spinner (`audio-button`, `sonner`). No `size-*` class on
 *  purpose: `buttonVariants` already sizes bare svgs per size variant
 *  (`[&_svg:not([class*='size-'])]:size-4`, `size-3` on xs/icon-xs). */
function Spinner() {
	return <Loader2Icon className="animate-spin" data-icon="inline-start" />;
}

/**
 * `Button` with a pending state, for anything driven by a mutation.
 *
 * Takes the same props as `Button` (it reuses `buttonVariants`' type, so
 * every variant, size, `asChild` and native button prop stays valid) plus:
 *
 * - `pending` — native `disabled` + `aria-busy`, and a spinner in place of
 *   the leading icon. Drives both visual state and the double-submit guard.
 * - `loadingLabel` — optional visible label while pending. Supplying it also
 *   hands the whole pending presentation to this component: the spinner
 *   replaces the entire children (icon included) so a leading icon and the
 *   spinner never appear side by side. Omit it to keep the children as-is
 *   and just prepend the spinner, which needs no message key.
 *
 * Pass `pending` from the mutation (`mutation.isPending`) rather than local
 * state: a local flag would clear the spinner before the request resolves.
 *
 * With `asChild` no spinner is injected — `Slot` requires a single child, so
 * adding one would break every `asChild` usage. `aria-busy`/`data-pending`
 * still land on the rendered child for the consumer to style.
 */
function SubmitButton({
	pending = false,
	loadingLabel,
	size,
	children,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		pending?: boolean;
		loadingLabel?: string;
	}) {
	return (
		<Button
			size={size}
			disabled={pending || props.disabled}
			aria-busy={pending || undefined}
			data-pending={pending || undefined}
			{...props}
		>
			{pending && !props.asChild ? (
				loadingLabel ? (
					<>
						<Spinner />
						{loadingLabel}
					</>
				) : ICON_SIZE.test(size ?? "") ? (
					<Spinner />
				) : (
					<>
						<Spinner />
						{children}
					</>
				)
			) : (
				children
			)}
		</Button>
	);
}

export { SubmitButton };
