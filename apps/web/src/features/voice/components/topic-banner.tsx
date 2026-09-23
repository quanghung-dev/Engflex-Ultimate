export function TopicBanner({ name, image }: { name: string; image: string }) {
	return (
		<div className="relative h-40 overflow-hidden rounded-xl border">
			{image ? (
				<img
					src={image}
					alt=""
					className="absolute inset-0 size-full object-cover"
				/>
			) : (
				<div className="absolute inset-0 bg-linear-to-br from-primary/30 to-accent-violet/20" />
			)}
			<div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent" />
			<div className="relative flex h-full items-end p-4">
				<span className="rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground">
					{name}
				</span>
			</div>
		</div>
	);
}
