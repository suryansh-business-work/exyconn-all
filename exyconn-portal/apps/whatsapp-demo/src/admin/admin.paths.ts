/** Where the admin area is mounted (App.tsx routes `/admin/*` here). */
export const ADMIN_BASE = '/admin';

/**
 * The demo itself, which every "back" in the admin area returns to. Mirrors App.tsx's
 * `HOME_PATH`; it is not imported from there because App imports this area, and the cycle
 * would load the admin bundle before the route table that mounts it.
 */
export const DEMO_PATH = '/whatsapp-demo';

/** The admin tabs, as URL slugs under `ADMIN_BASE`. The first is the default. */
export const ADMIN_TAB = {
  analytics: 'analytics',
  sessions: 'sessions',
  botWorkflows: 'bot-workflows',
  whatsappNumber: 'whatsapp-number',
} as const;
