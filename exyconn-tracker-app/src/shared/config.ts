/** Runtime configuration for the tracker app. */

/** Portal GraphQL endpoint. Overridable at build/run time; defaults to local dev. */
export const PORTAL_GRAPHQL_URL =
  process.env.PORTAL_GRAPHQL_URL ?? 'http://localhost:4004/graphql';

/** Exactly what the app records, shown verbatim on the consent screen and in the tray. */
export const DISCLOSURE_ITEMS = [
  'Time worked, and whether you are active or idle',
  'The number of key presses and mouse clicks — never which keys, never what you type',
  'Which application and window is in the foreground, and for how long',
  'Periodic screenshots of your screen',
] as const;
