import type { ReactNode } from "react";

export interface Slide {
	key: string;
	node: ReactNode;
}

/** Horizontal slide track: one slide at a time, no step numbers or indicators. */
export function SlideTrack({
	index,
	slides,
}: {
	index: number;
	slides: Slide[];
}) {
	return (
		<div className="overflow-hidden">
			<div
				className="flex transition-transform duration-300 ease-out"
				style={{ transform: `translateX(-${index * 100}%)` }}
			>
				{slides.map((slide) => (
					<div key={slide.key} className="w-full shrink-0">
						{slide.node}
					</div>
				))}
			</div>
		</div>
	);
}
