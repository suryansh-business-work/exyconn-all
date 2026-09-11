/**
 * `@exyconn/tracker-core` — the Exyconn Tracker with the platform taken out.
 *
 * The desktop (Electron) and mobile (Expo) trackers are two shells around one set of rules: the
 * same portal operations, the same durable outbox, the same schedule and presence decisions, the
 * same zone-aware wording. Two copies of any of these would drift — the app would stop at six
 * while the warning said seven — so each lives here once, free of any platform import.
 */
export * from './types';
export * from './activity';
export * from './auto-stop';
export * from './branding';
export * from './capture-overlay';
export * from './capture-policy';
export * from './controller';
export * from './engine';
export * from './foreground-usage';
export * from './insights';
export * from './format';
export * from './logger';
export * from './outbox';
export * from './presence';
export * from './report-csv';
export * from './schedule';
export * from './settings-rows';
export * from './sync-text';
export * from './time';
export * from './timezone';
export * from './version';
export * from './work-day';
export * from './portal/client';
export * from './portal/day-summary';
export * from './portal/login-message';
export * from './portal/portal-error';
export * from './portal/sync-message';
