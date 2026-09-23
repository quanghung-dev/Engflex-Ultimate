import type { Profile } from "@engflex/contracts";

/** mock-only: single in-memory profile until GET /profiles/me exists. */
export const PROFILE: Profile = {
	id: "prof_mock_1",
	userId: "user_mock_1",
	preferences: {
		level: "intermediate",
		primaryGoal: "work",
		dailyCommitmentMin: 15,
		topics: ["business", "technology", "news"],
	},
	onboardingCompletedAt: "2026-05-18T09:00:00Z",
	createdAt: "2026-05-18T09:00:00Z",
	updatedAt: "2026-05-18T09:00:00Z",
};
