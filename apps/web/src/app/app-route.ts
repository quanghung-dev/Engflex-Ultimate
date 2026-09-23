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
