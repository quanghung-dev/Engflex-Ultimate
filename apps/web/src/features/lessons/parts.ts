import type { ActivityType } from "@engflex/contracts";
import {
	BookOpen,
	Headphones,
	type LucideIcon,
	Mic,
	PenLine,
} from "lucide-react";
import { m } from "#/paraglide/messages";

/** Presentation chrome per activity type: short label + icon. */
export const PART_META: Record<
	ActivityType,
	{ label: () => string; icon: LucideIcon }
> = {
	reading: { label: () => m["lessons.part.reading"](), icon: BookOpen },
	listening: {
		label: () => m["lessons.part.listening"](),
		icon: Headphones,
	},
	writing: { label: () => m["lessons.part.writing"](), icon: PenLine },
	speaking: { label: () => m["lessons.part.speaking"](), icon: Mic },
};
