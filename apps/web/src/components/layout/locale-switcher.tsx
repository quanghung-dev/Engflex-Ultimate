import { cn } from "cn";
import { Languages } from "lucide-react";
import { Button } from "#/components/ui/button";
import { getLocale, locales, setLocale } from "#/paraglide/runtime";

/** Compact EN/VI pill toggle for the topbar. */
export function LocaleSwitcher() {
	const current = getLocale();
	return (
		<span className="flex items-center gap-1 rounded-full border bg-card px-1 py-0.5 text-xs shadow-xs">
			<Languages className="ml-1 size-[15px] text-muted-foreground" />
			{locales.map((locale) => (
				<Button
					key={locale}
					type="button"
					variant="ghost"
					size="sm"
					aria-pressed={locale === current}
					onClick={() => setLocale(locale)}
					className={cn(
						"h-6 rounded-full px-2 text-[11px] font-semibold",
						locale === current
							? "bg-secondary text-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{locale.toUpperCase()}
				</Button>
			))}
		</span>
	);
}
