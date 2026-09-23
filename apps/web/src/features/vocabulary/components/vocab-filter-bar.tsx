import type {
	CEFR,
	VocabularyDomain,
	VocabularySort,
	VocabularySource,
} from "@engflex/contracts";
import { cn } from "cn";
import { Search } from "lucide-react";
import { Kbd } from "#/components/common/kbd";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { m } from "#/paraglide/messages";

const SORT_MESSAGES: Record<VocabularySort, () => string> = {
	recent: () => m["vocabulary.sort.recent"](),
	mastery: () => m["vocabulary.sort.mastery"](),
	alphabetical: () => m["vocabulary.sort.alphabetical"](),
	interval: () => m["vocabulary.sort.interval"](),
};

const DOMAIN_MESSAGES: Record<VocabularyDomain, () => string> = {
	backend_db: () => m["vocabulary.domains.backend_db"](),
	distributed_systems: () => m["vocabulary.domains.distributed_systems"](),
	devops_cloud: () => m["vocabulary.domains.devops_cloud"](),
	frontend_ui: () => m["vocabulary.domains.frontend_ui"](),
	ai_ml: () => m["vocabulary.domains.ai_ml"](),
};

export interface VocabFilters {
	search: string;
	sort: VocabularySort;
	source: "all" | VocabularySource;
	domain: "all" | VocabularyDomain;
	cefr: "all" | CEFR;
}

export const DEFAULT_VOCAB_FILTERS: VocabFilters = {
	search: "",
	sort: "recent",
	source: "all",
	domain: "all",
	cefr: "all",
};

const SOURCE_TABS: Array<{
	value: VocabFilters["source"];
	label: () => string;
}> = [
	{ value: "all", label: () => m["vocabulary.filterSource.all"]() },
	{ value: "lesson", label: () => m["vocabulary.filterSource.lesson"]() },
	{
		value: "conversation",
		label: () => m["vocabulary.filterSource.conversation"](),
	},
	{ value: "manual", label: () => m["vocabulary.filterSource.manual"]() },
];

const CEFR_OPTIONS: Array<{
	value: VocabFilters["cefr"];
	label: string | (() => string);
}> = [
	{ value: "all", label: () => m["vocabulary.cefrAll"]() },
	{ value: "B1", label: "B1" },
	{ value: "B2", label: "B2" },
	{ value: "C1", label: "C1" },
];

export function VocabFilterBar({
	filters,
	onChange,
}: {
	filters: VocabFilters;
	onChange: (next: VocabFilters) => void;
}) {
	return (
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
			<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
				<div className="relative">
					<Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={filters.search}
						onChange={(event) =>
							onChange({ ...filters, search: event.target.value })
						}
						placeholder={m["vocabulary.filterSearch"]()}
						className="pr-14 pl-8"
					/>
					<span className="absolute top-1/2 right-2.5 -translate-y-1/2">
						<Kbd>⌘K</Kbd>
					</span>
				</div>
				<Select
					value={filters.sort}
					onValueChange={(value) =>
						onChange({ ...filters, sort: value as VocabularySort })
					}
				>
					<SelectTrigger className="w-[190px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{(Object.keys(SORT_MESSAGES) as VocabularySort[]).map((sort) => (
							<SelectItem key={sort} value={sort}>
								{SORT_MESSAGES[sort]()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Tabs
				value={filters.source}
				onValueChange={(value) =>
					onChange({ ...filters, source: value as VocabFilters["source"] })
				}
			>
				<TabsList className="flex-wrap">
					{SOURCE_TABS.map((tab) => (
						<TabsTrigger key={tab.value} value={tab.value}>
							{tab.label()}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			<div className="flex flex-wrap items-center gap-2">
				<span className="text-[11px] font-semibold text-muted-foreground">
					{m["vocabulary.domainLabel"]()}
				</span>
				<button
					type="button"
					onClick={() => onChange({ ...filters, domain: "all" })}
					className={cn(
						"rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
						filters.domain === "all"
							? "border-primary bg-secondary text-primary"
							: "border-border text-muted-foreground hover:border-primary/40",
					)}
				>
					{m["vocabulary.domainAll"]()}
				</button>
				{(Object.keys(DOMAIN_MESSAGES) as VocabularyDomain[]).map((domain) => (
					<button
						key={domain}
						type="button"
						onClick={() => onChange({ ...filters, domain })}
						className={cn(
							"rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
							filters.domain === domain
								? "border-primary bg-secondary text-primary"
								: "border-border text-muted-foreground hover:border-primary/40",
						)}
					>
						{DOMAIN_MESSAGES[domain]()}
					</button>
				))}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<span className="text-[11px] font-semibold text-muted-foreground">
					{m["vocabulary.cefrLabel"]()}
				</span>
				{CEFR_OPTIONS.map((option) => (
					<button
						key={option.value}
						type="button"
						onClick={() => onChange({ ...filters, cefr: option.value })}
						className={cn(
							"rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
							filters.cefr === option.value
								? "border-primary bg-secondary text-primary"
								: "border-border text-muted-foreground hover:border-primary/40",
						)}
					>
						{typeof option.label === "function" ? option.label() : option.label}
					</button>
				))}
			</div>
		</div>
	);
}
