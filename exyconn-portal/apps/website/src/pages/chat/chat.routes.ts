/** Where Website > Chatbot's screens live; the sidebar entries in the shell use the same paths. */
export const CHAT_PATHS = {
  sessions: '/website/chat/sessions',
  knowledge: '/website/chat/knowledge',
  faqs: '/website/chat/faqs',
  settings: '/website/chat/settings',
} as const;

/** One conversation; its thread tab (live / knowledge) follows as a URL slug. */
export const chatSessionPath = (id: string): string => `${CHAT_PATHS.sessions}/${id}`;
