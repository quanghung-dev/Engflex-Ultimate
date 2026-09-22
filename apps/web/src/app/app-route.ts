/** Centralized app route URLs. Use these instead of hardcoding paths. */
export const APP_ROUTES = {
  HOME: '/',
  CONTENTS: '/contents',
  VOCABULARY: '/vocabulary',
  PROGRESS: '/progress',
  CONVERSATIONS: '/conversations',
  AUTH: {
    SIGN_IN: '/sign-in',
    SIGN_UP: '/sign-up',
  },
  /** Error pages, also used as inline fallbacks. */
  ERROR: {
    UNAUTHORIZED: '/401',
    FORBIDDEN: '/403',
    NOT_FOUND: '/404',
    SERVER: '/500',
  },
} as const
