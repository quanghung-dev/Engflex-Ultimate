import type {
	ExamAnswer,
	ExamAttempt,
	ExamAttemptSummary,
	ExamReviewAttempt,
} from "@engflex/contracts";

type Attempt = ExamAttempt | ExamReviewAttempt;
type Draft = { answer: ExamAnswer; version: number };
type Operation = "save" | "submit" | "cancel";
type SessionState = {
	drafts: ReadonlyMap<string, Draft>;
	busy: Operation | null;
	terminal: boolean;
	error: boolean;
};
type Dependencies = {
	read: () => Attempt;
	accept: (attempt: Attempt) => void;
	get: () => Promise<Attempt>;
	patch: (
		revision: number,
		answers: ExamAnswer[],
		submit: boolean,
	) => Promise<Attempt>;
	cancel: () => Promise<ExamAttemptSummary>;
	closed: (attempt: Attempt | ExamAttemptSummary) => void;
};

/** One writer per mounted session. Server snapshots live only in Query cache;
 * the external store contains unacknowledged edits and transport state. */
export class ExamSessionController {
	private state: SessionState = {
		drafts: new Map(),
		busy: null,
		terminal: false,
		error: false,
	};
	private listeners = new Set<() => void>();
	private timer: ReturnType<typeof setTimeout> | undefined;
	private tail: Promise<void> = Promise.resolve();
	private version = 0;
	private uncertain = false;
	private locked = false;
	private active = true;
	constructor(private deps: Dependencies) {}
	getSnapshot = () => this.state;
	subscribe = (listener: () => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	private update(patch: Partial<SessionState>) {
		this.state = { ...this.state, ...patch };
		for (const listener of this.listeners) listener();
	}
	activate() {
		this.active = true;
	}
	dispose() {
		this.active = false;
		clearTimeout(this.timer);
	}
	edit(answer: ExamAnswer) {
		if (this.locked || this.deps.read().status !== "in_progress") return;
		const drafts = new Map(this.state.drafts);
		drafts.set(answer.questionId, { answer, version: ++this.version });
		this.update({ drafts });
		clearTimeout(this.timer);
		if (!this.state.error)
			this.timer = setTimeout(() => {
				if (!this.state.error) void this.enqueue("save", true);
			}, 500);
	}
	private accept(attempt: Attempt) {
		this.deps.accept(attempt);
		if (attempt.status !== "in_progress") {
			this.locked = true;
			clearTimeout(this.timer);
			this.update({ drafts: new Map() });
			if (this.active) this.deps.closed(attempt);
			return false;
		}
		return true;
	}
	private async write(submit: boolean) {
		if (this.uncertain) {
			const fresh = await this.deps.get();
			this.uncertain = false;
			if (!this.accept(fresh)) return;
		}
		for (let attempt = 0; attempt < 2; attempt++) {
			if (this.deps.read().status !== "in_progress") return;
			const batch = new Map(this.state.drafts);
			if (!submit && !batch.size) return;
			const revision = this.deps.read().result?.revision;
			if (!revision) throw new Error("Missing attempt revision");
			try {
				const result = await this.deps.patch(
					revision,
					[...batch.values()].map((draft) => draft.answer),
					submit,
				);
				if (!this.accept(result)) return;
				const drafts = new Map(this.state.drafts);
				for (const [id, sent] of batch) {
					if (drafts.get(id)?.version === sent.version) drafts.delete(id);
				}
				this.update({ drafts });
				if (submit) throw new Error("Submission did not complete");
				return;
			} catch (error) {
				this.uncertain = true;
				if (
					!(
						error &&
						typeof error === "object" &&
						"status" in error &&
						error.status === 409
					)
				)
					throw error;
				const fresh = await this.deps.get();
				this.uncertain = false;
				if (!this.accept(fresh)) return;
				if (attempt === 1) throw error;
			}
		}
	}
	/** Terminal intent locks synchronously, before waiting for an in-flight save. */
	run = (operation: Operation): Promise<void> => this.enqueue(operation, false);
	private enqueue(operation: Operation, automatic: boolean): Promise<void> {
		if (operation === "save" && this.locked) return this.tail;
		if (operation !== "save") {
			if (this.locked) return this.tail;
			this.locked = true;
			this.update({ terminal: true });
		}
		clearTimeout(this.timer);
		const job = this.tail.then(async () => {
			if (!this.active || this.deps.read().status !== "in_progress") return;
			// An edit made during the previous request may already have queued
			// another debounce. A failed writer suspends those jobs as well.
			if (automatic && this.state.error) return;
			this.update({ busy: operation, error: false });
			try {
				await this.write(operation === "submit");
				if (
					operation === "cancel" &&
					this.deps.read().status === "in_progress"
				) {
					const result = await this.deps.cancel();
					if (result.status === "in_progress")
						throw new Error("Cancellation did not close attempt");
					this.update({ drafts: new Map() });
					if (this.active) this.deps.closed(result);
				}
			} catch {
				this.uncertain = true;
				// A preceding autosave does not own the lock of an already queued
				// submit/cancel. Only that terminal operation may release its lock.
				if (operation !== "save") {
					this.locked = false;
					this.update({ error: true, terminal: false });
				} else this.update({ error: true });
			} finally {
				this.update({ busy: null });
			}
		});
		this.tail = job;
		return job;
	}
}
