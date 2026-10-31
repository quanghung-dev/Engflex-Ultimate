import type { ExamReviewContent } from "@engflex/contracts";
import { useState } from "react";
import { mediaSource, type ReviewBlock } from "#/features/exams/review";
import { m } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";

function ReviewImage({ src }: { src: string | null }) {
	const [failed, setFailed] = useState(false);
	return src && !failed ? (
		<img
			ref={(node) => {
				if (node?.complete && node.naturalWidth === 0) setFailed(true);
			}}
			src={src}
			alt={m["exams.toeic.result.review.imageAlt"]()}
			className="my-3 h-auto max-h-[32rem] max-w-full rounded-xl border object-contain"
			onError={() => setFailed(true)}
		/>
	) : (
		<p role="alert" className="text-sm text-muted-foreground">
			{m["exams.toeic.result.review.mediaFailed"]()}
		</p>
	);
}
export function ToeicReviewBlocks({
	blocks,
	assets,
	numbers,
}: {
	blocks: ReviewBlock[];
	assets: ExamReviewContent["assets"];
	numbers: ReadonlyMap<string, number>;
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
										? m["exams.toeic.result.review.blank"]({
												number: numbers.get(node.questionId) ?? 0,
											})
										: m["exams.toeic.result.review.insertion"]()}
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
							<ReviewImage
								key={block.assetId}
								src={mediaSource(block.assetId, assets)}
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
								<ReviewImage
									key={block.assetId}
									src={mediaSource(block.assetId, assets)}
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
						{getLocale() === "vi" && block.vietnameseText && (
							<p className="mt-2 text-xs text-muted-foreground">
								{block.vietnameseText}
							</p>
						)}
					</div>
				);
			})}
		</div>
	);
}
