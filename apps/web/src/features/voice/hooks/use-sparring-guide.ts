import { useEffect, useState } from "react";

/** localStorage flag behind "Don't show this tip again". */
const HIDE_GUIDE_KEY = "engflex:hide-sparring-guide";

function isGuideHidden(): boolean {
	try {
		return window.localStorage.getItem(HIDE_GUIDE_KEY) != null;
	} catch {
		return false;
	}
}

/**
 * Sparring guide visibility: opens on mount unless dismissed, reopens on
 * demand. localStorage (theme-toggle precedent) — a client-only preference
 * with no SSR need. Reads happen in an effect so SSR and first paint agree.
 */
export function useSparringGuide() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!isGuideHidden()) {
			setOpen(true);
		}
	}, []);

	const close = (dontShowAgain: boolean) => {
		if (dontShowAgain) {
			try {
				window.localStorage.setItem(HIDE_GUIDE_KEY, "1");
			} catch {
				// Private mode etc: the guide simply shows again next visit.
			}
		}
		setOpen(false);
	};

	return { open, setOpen, close };
}
