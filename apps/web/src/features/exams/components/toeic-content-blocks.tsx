import type { ExamTakingContent } from "@engflex/contracts";
import type { ReactNode } from "react";
import { useState } from "react";
import { mediaSource } from "#/features/exams/review";

type Block =
	ExamTakingContent["parts"][number]["items"][number]["media"][number];
type Copy = {
	imageAlt: string;
	mediaFailed: string;
	blank: (number: number) => string;
	insertion: string;
};

function ContentImage({ src, copy }: { src: string | null; copy: Copy }) {
	const [failed, setFailed] = useState(false);
	return src && !failed ? (
		<img
			ref={(node) => {
				if (node?.complete && node.naturalWidth === 0) setFailed(true);
			}}
			src={src}
			alt={copy.imageAlt}
			className="my-3 h-auto max-h-[32rem] max-w-full rounded-xl border object-contain"
			onError={() => setFailed(true)}
		/>
	) : (
		<p role="alert" className="text-sm text-muted-foreground">
			{copy.mediaFailed}
		</p>
	);
}
export function ToeicContentBlocks({
	blocks,
	assets,
	numbers,
	copy,
	renderTranslation,
}: {
	blocks: Block[];
	assets: ExamTakingContent["assets"];
	numbers: ReadonlyMap<string, number>;
	copy: Copy;
	renderTranslation?: (id: string) => ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3">
			{blocks.map((block) => {
				const inline = block.inline.length
					? block.inline.map((node) =>
							node.type === "blank" || node.type === "insertionPoint" ? (
								<mark
									key={node.id}
									id={node.id}
									className="mx-1 rounded bg-primary/10 px-1 text-foreground"
								>
									{node.questionId && numbers.has(node.questionId)
										? copy.blank(numbers.get(node.questionId) ?? 0)
										: copy.insertion}
								</mark>
							) : (
								<span
									key={node.id}
									id={node.id}
									className={
										node.type === "markedText"
											? "font-semibold underline"
											: undefined
									}
								>
									{node.text}
								</span>
							),
						)
					: block.text;
				return (
					<div
						key={block.id}
						id={block.id}
						className="whitespace-pre-wrap text-sm leading-relaxed"
					>
						{block.type === "image" ? (
							<ContentImage
								key={block.assetId}
								src={mediaSource(block.assetId, assets)}
								copy={copy}
							/>
						) : block.type === "table" ? (
							block.rows?.length ? (
								<div className="overflow-x-auto">
									<table className="w-full border-collapse">
										<tbody>
											{block.rows.map((row, index) => (
												<tr key={JSON.stringify([index, row])}>
													{row.map((cell, column) => (
														<td
															key={JSON.stringify([column, cell])}
															className="border p-2"
														>
															{cell}
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<ContentImage
									key={block.assetId}
									src={mediaSource(block.assetId, assets)}
									copy={copy}
								/>
							)
						) : block.type === "heading" ? (
							<h4 className="font-bold">{inline}</h4>
						) : (
							<p
								className={
									block.type === "emailHeader"
										? "rounded-lg bg-muted p-3 font-medium"
										: block.type === "chatMessage"
											? "rounded-lg border p-3"
											: undefined
								}
							>
								{inline}
							</p>
						)}
						{renderTranslation?.(block.id)}
					</div>
				);
			})}
		</div>
	);
}
