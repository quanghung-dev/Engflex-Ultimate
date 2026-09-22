type ApiId = string | number

/** Backend paths only. No hardcoded URLs in services — import from here. */
export const API_ROUTES = {
  PROFILES: {
    ME: '/profiles/me',
    BY_ID: (id: ApiId) => `/profiles/${id}`,
  },
  CONTENTS: {
    LIST: '/contents',
    BY_ID: (id: ApiId) => `/contents/${id}`,
  },
  EXERCISES: {
    LIST: '/exercises',
    BY_ID: (id: ApiId) => `/exercises/${id}`,
  },
  ATTEMPTS: {
    LIST: '/attempts',
    BY_ID: (id: ApiId) => `/attempts/${id}`,
  },
  VOCABULARY: {
    LIST: '/vocabulary',
    BY_ID: (id: ApiId) => `/vocabulary/${id}`,
  },
  PERSONAS: {
    LIST: '/personas',
    BY_ID: (id: ApiId) => `/personas/${id}`,
  },
  CONVERSATIONS: {
    LIST: '/conversations',
    BY_ID: (id: ApiId) => `/conversations/${id}`,
    TURNS: (id: ApiId) => `/conversations/${id}/turns`,
    FEEDBACK: (id: ApiId) => `/conversations/${id}/feedback`,
  },
} as const
