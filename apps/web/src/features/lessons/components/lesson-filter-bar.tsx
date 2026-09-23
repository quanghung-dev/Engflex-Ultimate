import type { ActivityType, CEFR, LessonStatus } from "@engflex/contracts";
import { Search } from "lucide-react";
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

export interface LessonFilters {
	search: string;
	level: "all" | CEFR;
	status: "all" | LessonStatus;
	skill: "all" | ActivityType;
}

export const DEFAULT_LESSON_FILTERS: LessonFilters = {
	search: "",
	level: "all",
	status: "all",
	skill: "all",
};

const LEVEL_OPTIONS: Array<{
	value: LessonFilters["level"];
	label: () => string;
}> = [
	{ value: "all", label: () => m["lessons.filterAllLevels"]() },
	{ value: "B1", label: () => m["lessons.levelB1"]() },
	{ value: "B2", label: () => m["lessons.levelB2"]() },
	{ value: "C1", label: () => m["lessons.levelC1"]() },
];

const STATUS_OPTIONS: Array<{
	value: LessonFilters["status"];
	label: () => string;
}> = [
	{ value: "all", label: () => m["lessons.filterAllStatuses"]() },
	{ value: "in_progress", label: () => m["lessons.statusInProgress"]() },
	{ value: "completed", label: () => m["lessons.statusCompleted"]() },
	{ value: "unstarted", label: () => m["lessons.statusUnstarted"]() },
];

const SKILL_TABS: Array<{
	value: LessonFilters["skill"];
	label: () => string;
}> = [
	{ value: "all", label: () => m["lessons.skillAll"]() },
	{ value: "reading", label: () => m["lessons.skill.reading"]() },
	{ value: "dictation", label: () => m["lessons.skill.dictation"]() },
	{ value: "writing", label: () => m["lessons.skill.writing"]() },
	{ value: "voice", label: () => m["lessons.skill.voice"]() },
];

export function LessonFilterBar({
	filters,
	onChange,
}: {
	filters: LessonFilters;
	onChange: (next: LessonFilters) => void;
}) {
	return (
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<div className="relative">
					<Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={filters.search}
						onChange={(event) =>
							onChange({ ...filters, search: event.target.value })
						}
						placeholder={m["lessons.filterSearch"]()}
						className="pl-8"
					/>
				</div>
				<Select
					value={filters.level}
					onValueChange={(value) =>
						onChange({ ...filters, level: value as LessonFilters["level"] })
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={m["common.levelFilter"]()} />
					</SelectTrigger>
					<SelectContent>
						{LEVEL_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={filters.status}
					onValueChange={(value) =>
						onChange({ ...filters, status: value as LessonFilters["status"] })
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={m["common.statusFilter"]()} />
					</SelectTrigger>
					<SelectContent>
						{STATUS_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Tabs
				value={filters.skill}
				onValueChange={(value) =>
					onChange({ ...filters, skill: value as LessonFilters["skill"] })
				}
			>
				<TabsList className="flex-wrap">
					{SKILL_TABS.map((tab) => (
						<TabsTrigger key={tab.value} value={tab.value}>
							{tab.label()}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
}
