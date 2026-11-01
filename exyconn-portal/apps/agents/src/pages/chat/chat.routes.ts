/** Where Agents > Website chat's screens live; the sidebar entries in the shell use the same paths. */
export const CHAT_PATHS = {
  sessions: '/agents/chat/sessions',
  knowledge: '/agents/chat/knowledge',
  faqs: '/agents/chat/faqs',
  settings: '/agents/chat/settings',
} as const;

/** One conversation; its thread tab (live / knowledge) follows as a URL slug. */
export const chatSessionPath = (id: string): string => `${CHAT_PATHS.sessions}/${id}`;
