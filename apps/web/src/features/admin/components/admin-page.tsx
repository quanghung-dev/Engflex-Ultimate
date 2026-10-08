import type { ReactNode } from "react";
import { PageHeader } from "#/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";

export interface AdminTab {
	value: string;
	label: string;
	content: ReactNode;
}

/** One back-office screen: header, then one tab per table the section owns. */
export function AdminPage({
	title,
	subtitle,
	tabs,
	children,
}: {
	title: string;
	subtitle: string;
	tabs?: AdminTab[];
	children?: ReactNode;
}) {
	return (
		<div className="container-content flex flex-col gap-6 py-8">
			<PageHeader title={title} subtitle={subtitle} />
			{tabs?.length ? (
				<Tabs defaultValue={tabs[0]?.value} className="gap-4">
					<TabsList>
						{tabs.map((tab) => (
							<TabsTrigger key={tab.value} value={tab.value}>
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>
					{tabs.map((tab) => (
						<TabsContent key={tab.value} value={tab.value}>
							{tab.content}
						</TabsContent>
					))}
				</Tabs>
			) : null}
			{children}
		</div>
	);
}
