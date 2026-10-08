import type { Level } from "@engflex/contracts";
import { useStore } from "@tanstack/react-store";
import { cn } from "cn";
import { useState } from "react";
import { Badge } from "#/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	dateColumn,
	textColumn,
	titleColumn,
} from "#/features/admin/components/columns";
import {
	type ResourceConfig,
	ResourcePanel,
} from "#/features/admin/components/resource-panel";
import { adminStore, removeRow, saveRow } from "#/features/admin/store";
import type {
	AdminRole,
	AdminUser,
	AdminUserStatus,
} from "#/features/admin/types";
import { m } from "#/paraglide/messages";

const ROLE_LABELS: Record<AdminRole, () => string> = {
	admin: () => m["admin.users.role.admin"](),
	user: () => m["admin.users.role.user"](),
};

const STATUS_LABELS: Record<AdminUserStatus, () => string> = {
	active: () => m["admin.users.status.active"](),
	suspended: () => m["admin.users.status.suspended"](),
};

const LEVEL_LABELS: Record<Level, () => string> = {
	beginner: () => m["admin.users.level.beginner"](),
	intermediate: () => m["admin.users.level.intermediate"](),
	advanced: () => m["admin.users.level.advanced"](),
};

const optionsOf = <K extends string>(labels: Record<K, () => string>) =>
	(Object.keys(labels) as K[]).map((value) => ({
		value,
		label: labels[value](),
	}));

type UserForm = { role: string; status: string; level: string };

/**
 * Edit-only (no `blank`): accounts are created by Clerk sign-up, and name and
 * email are Clerk-owned, so the back office only changes what we store.
 */
const USER_CONFIG: ResourceConfig<AdminUser, UserForm> = {
	noun: () => m["admin.users.noun"](),
	columns: [
		titleColumn(
			"name",
			() => m["admin.fields.name"](),
			(user) => user.name,
			(user) => user.email,
		),
		{
			id: "role",
			header: () => m["admin.fields.role"](),
			accessorFn: (user) => ROLE_LABELS[user.role](),
			cell: ({ row }) => (
				<Badge
					variant={row.original.role === "admin" ? "default" : "secondary"}
				>
					{ROLE_LABELS[row.original.role]()}
				</Badge>
			),
		},
		{
			id: "status",
			header: () => m["admin.fields.status"](),
			accessorFn: (user) => STATUS_LABELS[user.status](),
			cell: ({ row }) => (
				<span className="inline-flex items-center gap-1.5 text-sm">
					<span
						className={cn(
							"size-2 rounded-full",
							row.original.status === "active"
								? "bg-emerald-500"
								: "bg-destructive",
						)}
					/>
					{STATUS_LABELS[row.original.status]()}
				</span>
			),
		},
		textColumn(
			"level",
			() => m["admin.fields.level"](),
			(user) => LEVEL_LABELS[user.level](),
		),
		dateColumn(
			"joined",
			() => m["admin.fields.joined"](),
			(u) => u.joinedAt,
		),
		dateColumn(
			"lastActive",
			() => m["admin.fields.lastActive"](),
			(u) => u.lastActiveAt,
		),
	],
	fields: [
		{
			name: "role",
			label: () => m["admin.fields.role"](),
			kind: "select",
			options: () => optionsOf(ROLE_LABELS),
		},
		{
			name: "status",
			label: () => m["admin.fields.status"](),
			kind: "select",
			options: () => optionsOf(STATUS_LABELS),
		},
		{
			name: "level",
			label: () => m["admin.fields.level"](),
			kind: "select",
			options: () => optionsOf(LEVEL_LABELS),
			full: true,
		},
	],
	toForm: (user) => ({
		role: user.role,
		status: user.status,
		level: user.level,
	}),
	fromForm: (values, user) => ({
		...(user as AdminUser),
		role: values.role as AdminRole,
		status: values.status as AdminUserStatus,
		level: values.level as Level,
	}),
	label: (user) => user.name,
};

type RoleFilter = "all" | AdminRole;

export function UsersPanel() {
	const users = useStore(adminStore, (state) => state.users);
	const [role, setRole] = useState<RoleFilter>("all");
	const rows =
		role === "all" ? users : users.filter((user) => user.role === role);

	return (
		<ResourcePanel
			config={USER_CONFIG}
			rows={rows}
			onSave={(user) => saveRow("users", user)}
			onDelete={(user) => removeRow("users", user.id)}
			toolbar={
				<Select
					value={role}
					onValueChange={(next) => setRole(next as RoleFilter)}
				>
					<SelectTrigger
						className="w-40"
						aria-label={m["admin.users.roleFilter"]()}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{m["admin.users.allRoles"]()}</SelectItem>
						{optionsOf(ROLE_LABELS).map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			}
		/>
	);
}
