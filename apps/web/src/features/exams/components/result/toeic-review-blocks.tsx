import type { ExamReviewContent } from "@engflex/contracts";
import type { ReviewBlock } from "#/features/exams/review";
import { m } from "#/paraglide/messages";
import { getLocale } from "#/paraglide/runtime";
import { ToeicContentBlocks } from "../toeic-content-blocks";

export function ToeicReviewBlocks({
	blocks,
	assets,
	numbers,
}: {
	blocks: ReviewBlock[];
	assets: ExamReviewContent["assets"];
	numbers: ReadonlyMap<string, number>;
}) {
	const translations = new Map(
		blocks.map((block) => [block.id, block.vietnameseText]),
	);
	return (
		<ToeicContentBlocks
			blocks={blocks}
			assets={assets}
			numbers={numbers}
			copy={{
				imageAlt: m["exams.toeic.result.review.imageAlt"](),
				mediaFailed: m["exams.toeic.result.review.mediaFailed"](),
				blank: (number) => m["exams.toeic.result.review.blank"]({ number }),
				insertion: m["exams.toeic.result.review.insertion"](),
			}}
			renderTranslation={(id) =>
				getLocale() === "vi" && translations.get(id) ? (
					<p className="mt-2 text-xs text-muted-foreground">
						{translations.get(id)}
					</p>
				) : null
			}
		/>
	);
}
