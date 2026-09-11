/** Where a log came from. Each maps to one part of the monorepo (see `SOURCE_CODE_HINTS`). */
export const APP_LOG_SOURCES = ['PORTAL', 'DESKTOP', 'MOBILE', 'SERVER'] as const;
export type AppLogSource = (typeof APP_LOG_SOURCES)[number];

export const APP_LOG_LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'] as const;
export type AppLogLevel = (typeof APP_LOG_LEVELS)[number];

/** A group is OPEN until someone resolves or ignores it; a new occurrence re-opens a RESOLVED one. */
export const APP_LOG_STATUSES = ['OPEN', 'RESOLVED', 'IGNORED'] as const;
export type AppLogStatus = (typeof APP_LOG_STATUSES)[number];

/** Occurrences are evidence, not records: they expire. Groups (and their counts) stay. */
export const APP_LOG_EVENT_TTL_SECONDS = 30 * 24 * 60 * 60;

/** A client never sends more than this many entries in one call (the clients batch 25). */
export const MAX_ENTRIES_PER_BATCH = 50;

/** Per caller (user id, else IP): at most this many batches per window. */
export const INGEST_WINDOW_MS = 10 * 60 * 1000;
export const INGEST_MAX_BATCHES = 300;

/** Stored text is cut to these lengths — a log line, not a document. */
export const FIELD_LIMITS = {
  short: 200,
  message: 2000,
  stack: 12_000,
  componentStack: 6000,
  context: 6000,
  breadcrumb: 300,
} as const;
export const MAX_BREADCRUMBS = 30;

/** How many occurrences the detail drawer and the Claude prompt show. */
export const RECENT_EVENTS_LIMIT = 20;
export const PROMPT_EVENTS_LIMIT = 8;
export const PROMPT_OPEN_GROUPS_LIMIT = 20;

/**
 * GraphQL error codes that are a correct answer, not a server fault — a wrong password or a
 * missing permission is the API working. Everything else a resolver throws is logged.
 */
export const EXPECTED_ERROR_CODES = new Set([
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'BAD_USER_INPUT',
  'GRAPHQL_VALIDATION_FAILED',
  'GRAPHQL_PARSE_FAILED',
  'PERSISTED_QUERY_NOT_FOUND',
]);

/** Where each source's code lives, so a pasted prompt tells Claude where to start reading. */
export const SOURCE_CODE_HINTS: Record<AppLogSource, string> = {
  PORTAL:
    'Portal micro-frontend: exyconn-portal/apps/<app>/src, shared shell in packages/shell/src, grids in packages/crud.',
  DESKTOP:
    'Electron tracker: exyconn-tracker-app/src (main = Node main process, renderer = React UI), shared rules in packages/tracker-core/src.',
  MOBILE:
    'Expo tracker (Android/iOS, Hermes release build): exyconn-tracker-mobile/src (screens in src/app, UI in src/components), shared rules in packages/tracker-core/src.',
  SERVER:
    'GraphQL API: exyconn-portal/server/src/modules/<module> — the route is the GraphQL operation name.',
};
