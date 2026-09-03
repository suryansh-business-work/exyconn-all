import type { Branding, DayDetail, ReportDay, TrackerSettings, TrackerTotals } from '@shared/types';
import { secureStore } from './store';
import { summarizeDay, type RawDay } from './day-summary';

const PRODUCTION_GRAPHQL_URL = 'https://portal-server.exyconn.com/graphql';
const DEV_GRAPHQL_URL = 'http://localhost:4004/graphql';

/**
 * Portal GraphQL endpoint (main process only). An installed build has no environment
 * variables, so the default MUST be the real portal: defaulting to localhost shipped an
 * installer that could only ever talk to the employee's own machine, and nobody could sign in.
 *
 * electron-vite sets ELECTRON_RENDERER_URL only when serving the dev renderer, so it is the
 * one signal that distinguishes `npm run dev` from a packaged app. An explicit
 * PORTAL_GRAPHQL_URL still wins, for pointing a dev build at staging.
 */
const PORTAL_GRAPHQL_URL =
  process.env.PORTAL_GRAPHQL_URL ??
  (process.env.ELECTRON_RENDERER_URL ? DEV_GRAPHQL_URL : PRODUCTION_GRAPHQL_URL);

/**
 * Talks to the portal GraphQL API from the MAIN process. Requests originate from Node,
 * not a browser context, so the portal's single-origin CORS never applies.
 *
 * The device token is attached automatically; a portal error with an auth code (revoked
 * device or access) surfaces as `TrackerAuthError` so the engine can stop and sign out.
 */
export class TrackerAuthError extends Error {}

/**
 * A rejection that retrying can never fix — an oversized screenshot, or an interval whose
 * session the portal does not have. Retrying these forever wedges the whole outbox behind
 * them, so they are dropped instead of retried.
 */
export class TrackerRejectedError extends Error {}

const PERMANENT_CODES = new Set(['BAD_USER_INPUT', 'NOT_FOUND', 'GRAPHQL_VALIDATION_FAILED']);
const PERMANENT_HTTP = new Set([400, 404, 413, 422]);

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

/** What the portal said about a failed request, for the main-process log. */
async function reasonFor(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as GraphQLResponse<unknown>;
    const reasons = body.errors?.map((e) => e.message).join('; ') ?? '';
    return reasons === '' ? response.statusText : reasons;
  } catch {
    return response.statusText;
  }
}

async function request<T>(
  query: string,
  variables: Record<string, unknown>,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(PORTAL_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    // The body is read for the LOG, never for the employee: a rejected request is almost
    // always a query this build asks for and the portal no longer serves, and without the
    // reason in the log that is a bare status code to debug from.
    const message = `Portal request failed: HTTP ${response.status} — ${await reasonFor(response)}`;
    if (PERMANENT_HTTP.has(response.status)) {
      throw new TrackerRejectedError(message);
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;
  if (payload.errors?.length) {
    const authError = payload.errors.find(
      (e) => e.extensions?.code === 'UNAUTHENTICATED' || e.extensions?.code === 'FORBIDDEN',
    );
    if (authError) {
      throw new TrackerAuthError(authError.message);
    }
    const rejection = payload.errors.find((e) => PERMANENT_CODES.has(e.extensions?.code ?? ''));
    if (rejection) {
      throw new TrackerRejectedError(rejection.message);
    }
    throw new Error(payload.errors.map((e) => e.message).join('; '));
  }
  if (!payload.data) {
    throw new Error('Portal returned no data.');
  }
  return payload.data;
}

/** Authenticated request using the stored device token. */
function authed<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = secureStore().getToken();
  if (!token) {
    throw new TrackerAuthError('Not signed in.');
  }
  return request<T>(query, variables, token);
}

import type { DeviceInfo } from './device-info';

export type { DeviceInfo };

export interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string };
  consentRequired: boolean;
  settings: TrackerSettings;
}

/**
 * The workspace settings the app reads, selected in ONE place because three operations
 * return them (`trackerLogin`, `trackerMe`, `trackerHeartbeat`) and a field that drifts from
 * the portal's schema fails every one of them with an HTTP 400 that nobody can sign in past.
 * `schema-drift.test.ts` checks this list against the portal's own type definitions.
 */
export const SETTINGS_FIELDS = `
  intervalMinutes screenshotsPerInterval randomizeScreenshotTiming blurScreenshots
  trackWindowTitles idleThresholdSeconds screenshotMaxWidth screenshotQuality
  webcamEnabled webcamCorner syncIntervalMinutes consentText
`;

const LOGIN = `
  mutation TrackerLogin($email: String!, $password: String!, $device: TrackerDeviceInput!) {
    trackerLogin(email: $email, password: $password, device: $device) {
      token
      user { id name email }
      consentRequired
      settings { ${SETTINGS_FIELDS} }
    }
  }
`;

export async function login(
  email: string,
  password: string,
  device: DeviceInfo,
): Promise<LoginResponse> {
  const data = await request<{ trackerLogin: LoginResponse }>(LOGIN, { email, password, device });
  return data.trackerLogin;
}

/** Checked against the portal's schema by `schema-drift.test.ts`, like the settings. */
export const BRANDING_FIELDS = `
  businessName legalName slogan
  logoUrl logoDarkUrl appIconUrl faviconUrl
  primaryColor secondaryColor accentColor backgroundColor textColor
  supportEmail websiteUrl copyrightText
`;

const BRANDING = `query { publicBranding { ${BRANDING_FIELDS} } }`;

/** Brand identity for the app's chrome. Unauthenticated — the login screen needs it. */
export async function fetchBranding(): Promise<Branding> {
  const data = await request<{ publicBranding: Branding }>(BRANDING, {});
  return data.publicBranding;
}

const MY_REPORT = `
  query MyReport($from: DateTime!, $to: DateTime!, $timezone: String!) {
    myTrackerCalendar(from: $from, to: $to, timezone: $timezone) {
      date activeMs idleMs keyCount mouseCount sessions
    }
  }
`;

/**
 * The signed-in employee's OWN tracked time. The device token is a normal user JWT, so the
 * portal's `myTracker*` resolvers scope this to them — an employee can only ever see their
 * own report from the app.
 */
export async function fetchMyReport(
  from: string,
  to: string,
  timezone: string,
): Promise<ReportDay[]> {
  const data = await authed<{ myTrackerCalendar: ReportDay[] }>(MY_REPORT, {
    from,
    to,
    timezone,
  });
  return data.myTrackerCalendar;
}

const MY_DAY = `
  query MyDay($start: DateTime!, $end: DateTime!) {
    myTrackerDay(start: $start, end: $end) {
      intervals { activeMs idleMs keyCount mouseCount }
      screenshots { id capturedAt imageUrl blurred activityPercent }
      sessions { id }
    }
  }
`;

/**
 * One day of the signed-in employee's OWN work — their totals and their screenshots. Same
 * scoping guarantee as `fetchMyReport`: `myTrackerDay` resolves against the token's user, so
 * the app can never read another employee's day. `start`/`end` are the viewer's local
 * midnight bounds, computed in the renderer.
 */
export async function fetchMyDay(start: string, end: string): Promise<DayDetail> {
  const data = await authed<{ myTrackerDay: RawDay }>(MY_DAY, { start, end });
  return summarizeDay(data.myTrackerDay);
}

/**
 * Everything the app needs to render itself for the signed-in employee. `trackerMe` and
 * `trackerHeartbeat` return the same type, so they select the same fields — the app must
 * never learn less from a heartbeat than it did at sign-in.
 */
const ME_FIELDS = `
  user { id name email }
  consentRequired
  timezone
  settings { ${SETTINGS_FIELDS} }
`;

const TRACKER_ME = `query { trackerMe { ${ME_FIELDS} } }`;
const HEARTBEAT = `
  mutation Heartbeat($device: TrackerDeviceInput!) {
    trackerHeartbeat(device: $device) { ${ME_FIELDS} }
  }
`;

export interface TrackerMeResponse {
  user: { id: string; name: string; email: string };
  consentRequired: boolean;
  settings: TrackerSettings;
  /** The EFFECTIVE zone the portal resolved: this employee's pick, else the admin default. */
  timezone: string;
}

/** Rebuilds a remembered session from the stored device token (no password prompt). */
export async function trackerMe(): Promise<TrackerMeResponse> {
  const data = await authed<{ trackerMe: TrackerMeResponse }>(TRACKER_ME, {});
  return data.trackerMe;
}

const SET_TIMEZONE = `
  mutation SetTimezone($timezone: String!) {
    trackerSetTimezone(timezone: $timezone) { timezone }
  }
`;

/**
 * Records the zone THIS employee picked. The portal scopes the write to the device token's
 * own access row, so the app can never set anybody else's zone. Returns what was stored.
 */
export async function setTimezone(timezone: string): Promise<string> {
  const data = await authed<{ trackerSetTimezone: { timezone: string } }>(SET_TIMEZONE, {
    timezone,
  });
  return data.trackerSetTimezone.timezone;
}

const MY_TOTALS = `
  query {
    myTrackerTotals { activeMs idleMs screenshots sessions }
  }
`;

/**
 * The employee's OWN all-time totals. Device-token only by design — a portal session cannot
 * call this, and this app has nothing but the device token, so it is exactly the right query.
 */
export async function fetchMyTotals(): Promise<TrackerTotals> {
  const data = await authed<{ myTrackerTotals: TrackerTotals }>(MY_TOTALS, {});
  return data.myTrackerTotals;
}

export function acceptConsent(): Promise<{ trackerAcceptConsent: boolean }> {
  return authed(`mutation { trackerAcceptConsent }`);
}

/**
 * Keep-alive and settings pull in one call. Tells the portal this device is still online and
 * what it currently is — device details are otherwise only written at sign-in, and a device
 * token never expires, so the Devices console would show the app version an employee
 * enrolled with however many updates ago. Returns the portal's current view of this
 * employee, so an admin's change reaches a running app without anyone restarting it.
 */
export async function heartbeat(device: DeviceInfo): Promise<TrackerMeResponse> {
  const data = await authed<{ trackerHeartbeat: TrackerMeResponse }>(HEARTBEAT, { device });
  return data.trackerHeartbeat;
}

export async function startSession(startedAt: string): Promise<string> {
  const data = await authed<{ trackerStartSession: { id: string } }>(
    `mutation Start($startedAt: DateTime!) { trackerStartSession(startedAt: $startedAt) { id } }`,
    { startedAt },
  );
  return data.trackerStartSession.id;
}

export function stopSession(sessionId: string, endedAt: string): Promise<unknown> {
  return authed(
    `mutation Stop($sessionId: ID!, $endedAt: DateTime!) { trackerStopSession(sessionId: $sessionId, endedAt: $endedAt) { id } }`,
    { sessionId, endedAt },
  );
}

export interface IntervalPayload {
  startedAt: string;
  endedAt: string;
  keyCount: number;
  mouseCount: number;
  activeMs: number;
  idleMs: number;
  windows: Array<{ appName: string; windowTitle: string; durationMs: number }>;
}

export function syncIntervals(sessionId: string, intervals: IntervalPayload[]): Promise<unknown> {
  return authed(
    `mutation Sync($sessionId: ID!, $intervals: [TrackerIntervalInput!]!) {
       trackerSyncIntervals(sessionId: $sessionId, intervals: $intervals)
     }`,
    { sessionId, intervals },
  );
}

export interface ScreenshotPayload {
  sessionId: string;
  intervalStartedAt: string;
  capturedAt: string;
  image: string;
  displayId: string;
  blurred: boolean;
}

export function uploadScreenshot(input: ScreenshotPayload): Promise<unknown> {
  return authed(
    `mutation Upload($input: TrackerScreenshotInput!) {
       trackerUploadScreenshot(input: $input) { id }
     }`,
    { input },
  );
}
