/** Centralized app route URLs. Use these instead of hardcoding paths. */
export const APP_ROUTES = {
	HOME: "/",
	ONBOARDING: "/onboarding",
	LESSONS: "/lessons",
	LESSON_DETAIL: "/lessons/$lessonId",
	LESSON_PART: "/lessons/$lessonId/parts/$part",
	VOCABULARY: "/vocabulary",
	VOCABULARY_ITEM: "/vocabulary/$itemId",
	VOICE: "/voice",
	VOICE_SCENARIOS: "/voice/scenarios",
	VOICE_ROOM: "/voice/room",
	AUTH: {
		SIGN_IN: "/sign-in",
		SIGN_UP: "/sign-up",
	},
	/** Error pages, also used as inline fallbacks. */
	ERROR: {
		UNAUTHORIZED: "/401",
		FORBIDDEN: "/403",
		NOT_FOUND: "/404",
		SERVER: "/500",
	},
} as const;

/**
 * Topbar breadcrumbs, keyed by TanStack route id.
 * Verify keys against src/routeTree.gen.ts after `pnpm generate-routes`.
 */
export const BREADCRUMB_LABELS: Record<string, string[]> = {
	"/_app/": ["Home", "Daily practice"],
	"/_app/lessons/": ["Lessons"],
	"/_app/lessons/$lessonId/": ["Lessons", "Lesson detail"],
	"/_app/lessons/$lessonId/parts/$part": [
		"Lessons",
		"Lesson detail",
		"Practice",
	],
	"/_app/vocabulary/": ["Vocabulary"],
	"/_app/vocabulary/$itemId": ["Vocabulary", "Word detail"],
	"/_app/voice/": ["Voice"],
	"/_app/voice/scenarios": ["Voice", "Scenarios"],
	"/_app/voice/room": ["Voice", "Live studio"],
	"/onboarding": ["Onboarding"],
};
