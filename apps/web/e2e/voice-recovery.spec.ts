import { expect, test } from "@playwright/test";
import { ensureFakeMicAudio } from "./fake-mic";
import {
	apiCreateConversation,
	closeDb,
	dbDeleteConversation,
	dbListTurns,
} from "./helpers";

/**
 * On-demand transcript correction against a real engine, with nothing forced:
 * the learner opens the modal and every assertion follows from that.
 *
 * What only this run can prove, end to end:
 *  phase 1 (nothing intercepts): the fake-mic turn commits on its own and NO
 *    dialog appears. No signal interrupts the learner mid-sentence, and that is
 *    only observable end to end.
 *  phase 2 (edit): Review transcript opens a modal holding the ENGINE's copy of
 *    the turn; an edit rewrites that turn *in place* at the same position (DB
 *    ground truth) and the tutor regenerates a reply. The panel redraws to
 *    match, without anything being written to pipecat's own list.
 *  phase 3 (speak again): Speak again makes the engine listen while the field
 *    stays visible and editable, a spoken attempt becomes the field, the button
 *    survives for a SECOND attempt, and sending corrects the reviewed turn IN
 *    PLACE — same position, no appended turn — and gets a reply. The window
 *    swallows the utterance, so nothing short of this run proves the tutor ever
 *    answers it.
 */

const EDITED_MARKER = "e2e correction edited sentence";
const RAW_ANCHOR = /yesterday/i;
const REVIEW = "Review transcript";
const LISTENING = "Listening";

test.setTimeout(600_000);

const created: string[] = [];

test.beforeAll(() => {
	ensureFakeMicAudio();
});

test.beforeEach(async ({ context }) => {
	await context.addCookies([
		{
			name: "PARAGLIDE_LOCALE",
			value: "en",
			domain: "localhost",
			path: "/",
		},
	]);
});

test.afterEach(async ({ browser }, testInfo) => {
	// `browser` is destructured because Playwright requires the object
	// pattern here; the hook only needs testInfo.
	void browser;
	if (testInfo.status !== testInfo.expectedStatus) {
		console.log(`e2e: keeping failed conversation(s) ${created.join(",")}`);
		created.splice(0);
		return;
	}
	await Promise.all(created.splice(0).map((id) => dbDeleteConversation(id)));
});

test.afterAll(async () => {
	await closeDb();
});

async function userTurns(conversationId: string) {
	return (await dbListTurns(conversationId)).filter((t) => t.role === "user");
}

async function aiTurnCount(conversationId: string) {
	return (await dbListTurns(conversationId)).filter((t) => t.role === "ai")
		.length;
}

async function waitFor(
	read: () => Promise<boolean>,
	what: string,
	timeoutMs: number,
): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		if (await read()) return;
		if (Date.now() > deadline) {
			throw new Error(`e2e: timed out waiting for ${what}`);
		}
		await new Promise((r) => setTimeout(r, 2000));
	}
}

test("a misheard turn is corrected on demand, and a re-take is answered", async ({
	page,
}) => {
	// The command rides HTTP and the capture rides the RTVI data channel, so a
	// silent client is the most likely failure. Forward the browser's own
	// account of what it received instead of guessing from the DOM.
	page.on("console", (msg) =>
		console.log(`[browser:${msg.type()}] ${msg.text()}`),
	);
	page.on("pageerror", (err) =>
		console.log(`[browser:pageerror] ${err.message}`),
	);

	const conv = await apiCreateConversation({ mode: "free_talk" });
	created.push(conv.id);
	console.log(`e2e: correction conversation ${conv.id}`);

	await page.goto(`/voice/room/${conv.id}`);

	// Session is live: the partner speaks first (copies the live suite's
	// generous greeting budget — the proxied LLM endpoint varies wildly).
	const partnerRows = page
		.locator("li")
		.filter({ has: page.getByText("Partner", { exact: true }) });
	await expect(partnerRows.first()).toBeVisible({ timeout: 120_000 });
	const greetingCount = await aiTurnCount(conv.id);

	// Phase 1 — nothing intercepts. The first fake-mic instance commits as an
	// ordinary turn and NO dialog appears: no signal can interrupt the learner
	// mid-sentence, and only this run can see it.
	await waitFor(
		async () => (await userTurns(conv.id)).length > 0,
		"the first learner turn to commit",
		180_000,
	);
	await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15_000 });

	// Phase 2 — the learner opens the modal and corrects the turn.
	const review = page.getByRole("button", { name: REVIEW, exact: true });
	await expect(review).toBeEnabled();
	await review.click();
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible({ timeout: 30_000 });

	// The modal is modal for a reason: the engine holds the learner's
	// microphone. It must NOT also pause the tutor's playback — Radix's focus
	// trap can suspend media elements it contains, and if it did, the learner
	// would be correcting in silence while the bot is mid-sentence.
	const audioState = await page.evaluate(() =>
		[...document.querySelectorAll("audio")].map((a) => ({
			paused: a.paused,
			muted: a.muted,
		})),
	);
	expect(
		audioState.filter((a) => a.paused),
		`the focus trap paused the bot's audio: ${JSON.stringify(audioState)}`,
	).toEqual([]);
	// The modal holds the engine's own copy, which is what Send will rewrite.
	const textarea = dialog.getByRole("textbox");
	await expect(textarea).toBeVisible();
	const shown = await textarea.inputValue();
	expect(shown.length, "the modal must show the transcript").toBeGreaterThan(0);

	// The correction rewrites a turn IN PLACE, so remember which position the
	// learner turn occupies. It is not 1: the greeting is recorded first.
	const targetPosition = (await userTurns(conv.id))[0]?.position;
	expect(targetPosition, "no learner turn to review").toBeGreaterThan(0);

	await textarea.fill(EDITED_MARKER);
	await dialog.getByRole("button", { name: "Send", exact: true }).click();
	await expect(dialog).toBeHidden({ timeout: 30_000 });

	// Phase 2b — the panel is a derivation, not a mirror of pipecat. Nothing is
	// written back to pipecat's own list; the reviewed turn is redrawn with the
	// corrected words and the reply that answered the old ones is dropped. So
	// the corrected sentence must be on screen, and the learner turn count must
	// NOT have grown — a correction replaces, it never appends.
	const learnerRows = page
		.locator("li")
		.filter({ has: page.getByText("You", { exact: true }) });
	const learnerCountBefore = await learnerRows.count();
	await expect(page.getByText(EDITED_MARKER, { exact: true })).toBeVisible({
		timeout: 30_000,
	});
	expect(
		await learnerRows.count(),
		"the correction appended a learner turn instead of replacing one",
	).toBe(learnerCountBefore);

	// DB ground truth: that same position now carries the edited text. Later
	// positions are raw loop audio and are supposed to commit.
	await waitFor(
		async () => {
			const turn = (await dbListTurns(conv.id)).find(
				(t) => t.position === targetPosition,
			);
			return turn?.text === EDITED_MARKER;
		},
		`the corrected text at position ${targetPosition}`,
		60_000,
	);
	const corrected = (await dbListTurns(conv.id)).find(
		(t) => t.position === targetPosition,
	);
	expect(corrected?.text).toBe(EDITED_MARKER);
	expect(RAW_ANCHOR.test(corrected?.text ?? "")).toBe(false);

	// The correction regenerates a reply.
	await expect
		.poll(async () => aiTurnCount(conv.id), { timeout: 120_000 })
		.toBeGreaterThan(greetingCount);

	// Phase 3 — Speak again, as many times as it takes. Each attempt replaces
	// the field, and Send corrects the reviewed turn in place: an attempt is
	// never a new turn, however many the learner makes.
	await review.click();
	await expect(dialog).toBeVisible({ timeout: 30_000 });
	const field = dialog.getByRole("textbox");

	await dialog
		.getByRole("button", { name: "Speak again", exact: true })
		.click();
	await expect(dialog.getByText(LISTENING)).toBeVisible({ timeout: 60_000 });
	// Re-speaking and typing are separated: the engine is listening AND the
	// field is still there to read and to edit.
	await expect(field).not.toBeEmpty();

	await expect(
		dialog.getByRole("button", { name: "Send it", exact: true }),
	).toBeVisible({ timeout: 180_000 });

	// A second attempt. The button is still there: the number of tries is not
	// capped, and only a live run proves the engine accepts a second one.
	await dialog
		.getByRole("button", { name: "Speak again", exact: true })
		.click();
	await expect(
		dialog.getByRole("button", { name: "Send it", exact: true }),
	).toBeVisible({ timeout: 180_000 });
	const spoken = await field.inputValue();
	expect(
		spoken.trim().length,
		"the field held no spoken sentence",
	).toBeGreaterThan(0);

	// Read the transcript while the modal is open: the engine owns the
	// learner's microphone for the whole window, so nothing can commit
	// underneath us and the position we are about to correct is stable.
	const beforeSend = await userTurns(conv.id);
	const target = Math.max(...beforeSend.map((t) => t.position));
	const aiBefore = await aiTurnCount(conv.id);

	await dialog.getByRole("button", { name: "Send it", exact: true }).click();
	await expect(dialog).toBeHidden({ timeout: 30_000 });

	// In place: the reviewed turn now carries what was spoken, and the number of
	// learner turns is unchanged.
	await waitFor(
		async () => {
			const turn = (await dbListTurns(conv.id)).find(
				(t) => t.position === target,
			);
			return turn?.text === spoken;
		},
		`the spoken correction at position ${target}`,
		90_000,
	);
	const afterSend = await userTurns(conv.id);
	expect(
		afterSend.length,
		`a spoken attempt appended a turn instead of correcting one: ${JSON.stringify(
			afterSend.map((t) => t.text),
		)}`,
	).toBe(beforeSend.length);
	expect(afterSend.find((t) => t.position === target)?.text).toBe(spoken);

	// And the tutor answers the corrected sentence.
	await expect
		.poll(async () => aiTurnCount(conv.id), { timeout: 120_000 })
		.toBeGreaterThan(aiBefore);
});

test("dismissing the modal hands the microphone back", async ({ page }) => {
	const conv = await apiCreateConversation({ mode: "free_talk" });
	created.push(conv.id);
	await page.goto(`/voice/room/${conv.id}`);

	await expect(
		page
			.locator("li")
			.filter({ has: page.getByText("Partner", { exact: true }) })
			.first(),
	).toBeVisible({ timeout: 120_000 });
	await waitFor(
		async () => (await userTurns(conv.id)).length > 0,
		"the first learner turn to commit",
		180_000,
	);

	// Snapshot the whole transcript, so "dismissing recorded nothing" is a real
	// invariant rather than a count comparison.
	const before = await dbListTurns(conv.id);
	await page.getByRole("button", { name: REVIEW, exact: true }).click();
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible({ timeout: 30_000 });
	await dialog.getByRole("button", { name: "Dismiss", exact: true }).click();
	await expect(dialog).toBeHidden({ timeout: 30_000 });

	// Deliberately NOT asserting that another turn commits: the fixture loops
	// with 60 s of lead silence and the tutor may still be speaking, so barge-in
	// can swallow the next utterance (the "Barge-in is normal" gotcha). What
	// must hold is that dismissing changed nothing that already existed, and
	// that the session is still usable.
	const after = await dbListTurns(conv.id);
	for (const turn of before) {
		const still = after.find((t) => t.position === turn.position);
		expect(still?.text, `dismissing changed position ${turn.position}`).toBe(
			turn.text,
		);
	}
	await expect(
		page.getByRole("button", { name: REVIEW, exact: true }),
	).toBeEnabled();
});
