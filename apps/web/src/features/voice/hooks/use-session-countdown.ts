import { useEffect, useState } from "react";

/** Ticks down from maxMinutes and fires onExpire once at zero. NaN/zero/undefined means uncapped (free talk): returns 0 and never fires. */
export function useSessionCountdown(
	maxMinutes: number | undefined,
	onExpire: () => void,
): number {
	const totalSec =
		typeof maxMinutes === "number" &&
		Number.isFinite(maxMinutes) &&
		maxMinutes > 0
			? Math.round(maxMinutes * 60)
			: 0;
	const [left, setLeft] = useState(totalSec);
	useEffect(() => setLeft(totalSec), [totalSec]);
	useEffect(() => {
		if (!totalSec || left <= 0) return;
		const timer = setTimeout(() => {
			setLeft((v) => v - 1);
			if (left <= 1) onExpire();
		}, 1000);
		return () => clearTimeout(timer);
	}, [left, totalSec, onExpire]);
	return left;
}
