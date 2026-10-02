/** One bubble: consecutive same-role messages already collapsed together. */
export type Group = { key: string; isUser: boolean; text: string };

/** One accepted correction, as the panel needs it to redraw honestly. */
export type AppliedCorrection = {
	/** What the learner said it should say. */ text: string;
	/** How many bubbles existed when they sent it. Anything at or past this
	 * index arrived afterwards — the regenerated reply — and must survive. */
	boundary: number;
	/** The tail the send saw, by identity and words. Pipecat's client store
	 * mutates the last assistant message in place (same-role merge window,
	 * streaming appends), so the regenerated reply can arrive inside the stale
	 * message object instead of as a new entry. Dropping by position alone
	 * would hide it until the next user turn; dropping only what still matches
	 * keeps a morphed reply visible. */
	staleTail: { key: string; text: string }[];
};

/**
 * The corrected transcript, derived from pipecat's own message list.
 *
 * The engine owns the correction: it rewrote its context and the persisted
 * turns, and its regenerated reply overwrites the stale one at the same
 * position. Pipecat's client-side list knows none of that, so writing to it
 * would mean inventing a second history that disagrees with the server.
 * Instead the panel redraws: the reviewed turn takes the corrected text, and
 * only what provably answered the old words is dropped.
 *
 * The boundary is what keeps this from eating the reply the correction asks
 * for. Without it the transform would be reapplied on every render and the
 * regenerated answer would be discarded too.
 */
export function applyCorrection(
	groups: Group[],
	applied: AppliedCorrection | null,
): Group[] {
	if (!applied) return groups;
	let target = -1;
	for (let i = groups.length - 1; i >= 0; i--) {
		if (groups[i].isUser) {
			target = i;
			break;
		}
	}
	// The learner has spoken again since correcting, so the newest turn is not
	// the one they fixed. Their correction has been overtaken; leave it be.
	if (target < 0 || target >= applied.boundary) return groups;
	const staleByKey = new Map(applied.staleTail.map((e) => [e.key, e.text]));
	const tail: Group[] = [];
	for (let i = target + 1; i < groups.length; i++) {
		const g = groups[i];
		// Drop only what is provably stale: same identity, same words. A reply
		// merged into the stale message object changed its text, so it
		// survives; entries that never existed at send time were never stale.
		// A key the snapshot never saw is kept: lists only restructure by
		// appending, so an unknown key is new — fail visible, never hidden.
		if (staleByKey.get(g.key) !== undefined && staleByKey.get(g.key) === g.text)
			continue;
		tail.push(g);
	}
	return [
		...groups.slice(0, target),
		{ ...groups[target], text: applied.text },
		...tail,
	];
}
