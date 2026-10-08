import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";
import { useEffect } from "react";

/** One crumb: label always; a link only when it is not the current page.
 *  Targets come from `APP_ROUTES` at call sites — never URL literals. */
export interface CrumbItem {
	label: string;
	to?: string;
	params?: Record<string, string>;
}

const breadcrumbStore = new Store<{ items: CrumbItem[] }>({ items: [] });

/**
 * Publish this page's trail to the sticky header slot. Call unconditionally —
 * pass `[]` (or static labels) while data loads. Re-setting identical content
 * only re-renders the tiny trail and nothing feeds back, so call sites need
 * no memo. Unmount clears the slot so no trail leaks across pages.
 */
export function useBreadcrumbs(items: CrumbItem[]) {
	useEffect(() => {
		breadcrumbStore.setState(() => ({ items }));
		return () => breadcrumbStore.setState(() => ({ items: [] }));
	}, [items]);
}

/** Trail for the header slot. Empty until the first page publishes. */
export function useBreadcrumbItems(): CrumbItem[] {
	return useStore(breadcrumbStore, (state) => state.items);
}
