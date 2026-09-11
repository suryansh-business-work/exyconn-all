import {
  CreateTrackerManualEntryDocument,
  MarkMyTrackerMessagesReadDocument,
  MyTrackerCalendarDocument,
  MyTrackerDayDocument,
  MyTrackerManualEntriesDocument,
  MyTrackerMessagesDocument,
  MyTrackerTotalsDocument,
  PublicBrandingDocument,
  ReportClientLogsDocument,
  SendMyTrackerMessageDocument,
  SetMyTrackerPresenceDocument,
  TrackerAcceptConsentDocument,
  TrackerHeartbeatDocument,
  TrackerLatestReleaseDocument,
  TrackerLoginDocument,
  TrackerTimezonesDocument,
  TrackerMarkAttendanceDocument,
  TrackerMeDocument,
  TrackerSetTimezoneDocument,
  TrackerStartSessionDocument,
  TrackerStopSessionDocument,
  TrackerSyncIntervalsDocument,
  TrackerTaskOptionsDocument,
  TrackerUploadScreenshotDocument,
  WithdrawTrackerManualEntryDocument,
  type AppLogBatchInput,
  type TrackerMeFieldsFragment,
  type TrackerSettingsFieldsFragment,
  type TypedDocumentString,
} from '../graphql/generated';
import type {
  AttendanceStatus,
  AuthUser,
  Branding,
  ConsentPolicy,
  DayDetail,
  DeviceInfo,
  IntervalPayload,
  ManualEntry,
  ManualEntryDraft,
  PresenceState,
  PresenceStatus,
  ReportDay,
  ScreenshotPayload,
  TrackerMessage,
  TrackerMessageKind,
  TrackerProject,
  TrackerSettings,
  TrackerTask,
  TrackerTotals,
  WebcamCorner,
  WorkProfile,
  Workday,
} from '../types';
import { summarizeDay } from './day-summary';
import { TrackerAuthError, TrackerRejectedError } from './portal-error';

const PERMANENT_CODES = new Set(['BAD_USER_INPUT', 'NOT_FOUND', 'GRAPHQL_VALIDATION_FAILED']);
const PERMANENT_HTTP = new Set([400, 404, 413, 422]);
const AUTH_CODES = new Set(['UNAUTHENTICATED', 'FORBIDDEN']);
const WEBCAM_CORNERS: ReadonlySet<string> = new Set<WebcamCorner>([
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]);

interface GraphQLError {
  message: string;
  extensions?: { code?: string };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface PortalClientConfig {
  /** The portal's GraphQL endpoint. */
  url: string;
  /** The stored device token, or null when nobody is signed in. */
  getToken: () => string | null | Promise<string | null>;
}

/** One downloadable file on a tracker release. */
export interface ReleaseAsset {
  name: string;
  /** windows, macos, linux, android or ios. */
  platform: string;
  url: string;
  sizeBytes: number;
}

/** The newest published tracker build for one platform. */
export interface LatestRelease {
  version: string;
  /** The release page, for a platform that cannot install from a direct download. */
  url: string;
  publishedAt: string;
  assets: ReleaseAsset[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  consentRequired: boolean;
  settings: TrackerSettings;
}

/**
 * Everything an app needs to render itself for the signed-in employee. `trackerMe` and
 * `trackerHeartbeat` return the same type, so they select the same fields — an app must never
 * learn less from a heartbeat than it did at sign-in.
 */
export interface TrackerMeResponse {
  user: AuthUser;
  consentRequired: boolean;
  settings: TrackerSettings;
  /** The EFFECTIVE zone the portal resolved: this employee's pick, else the admin default. */
  timezone: string;
  workProfile: WorkProfile;
  workday: Workday;
  projects: TrackerProject[];
  consentPolicy: ConsentPolicy | null;
  presence: PresenceState;
  /** Announcements this employee has not seen. The app raises them, then marks them read. */
  notices: TrackerMessage[];
  unreadMessages: number;
}

/** What the portal said about a failed request, for the log — never for the employee. */
async function reasonFor(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as GraphQLResponse<unknown>;
    const reasons = body.errors?.map((e) => e.message).join('; ') ?? '';
    return reasons === '' ? response.statusText : reasons;
  } catch {
    return response.statusText;
  }
}

/** Turns the portal's GraphQL errors into the one error class the caller acts on. */
function errorFrom(errors: readonly GraphQLError[]): Error {
  const authError = errors.find((e) => AUTH_CODES.has(e.extensions?.code ?? ''));
  if (authError) {
    return new TrackerAuthError(authError.message);
  }
  const rejection = errors.find((e) => PERMANENT_CODES.has(e.extensions?.code ?? ''));
  if (rejection) {
    return new TrackerRejectedError(rejection.message);
  }
  return new Error(errors.map((e) => e.message).join('; '));
}

/**
 * The schema types `webcamCorner` as a plain String; the portal's model only ever stores one of
 * the four corners, so anything else is narrowed to the portal's own default.
 */
function toSettings(raw: TrackerSettingsFieldsFragment): TrackerSettings {
  const corner = WEBCAM_CORNERS.has(raw.webcamCorner)
    ? (raw.webcamCorner as WebcamCorner)
    : 'bottom-right';
  return { ...raw, webcamCorner: corner };
}

function toMe(raw: TrackerMeFieldsFragment): TrackerMeResponse {
  return { ...raw, settings: toSettings(raw.settings) };
}

/**
 * Talks to the portal's GraphQL API with the tracker's own operations, every one of them typed
 * by codegen against the portal's schema. Each app hands in where the portal is and how to read
 * its stored device token; everything else — the operations, the error classification, the
 * shape of what comes back — is decided here, once, for both trackers.
 *
 * A portal error with an auth code (revoked device or access) surfaces as `TrackerAuthError`, so
 * the engine can stop and sign out; one retrying can never fix is a `TrackerRejectedError`.
 */
export function createPortalClient(config: PortalClientConfig) {
  async function request<TResult, TVariables>(
    document: TypedDocumentString<TResult, TVariables>,
    variables: TVariables,
    token: string | null,
  ): Promise<TResult> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: document.toString(), variables }),
    });

    if (!response.ok) {
      // The body is read for the LOG, never for the employee: a rejected request is almost
      // always a query this build asks for and the portal no longer serves.
      const message = `Portal request failed: HTTP ${response.status} — ${await reasonFor(response)}`;
      if (PERMANENT_HTTP.has(response.status)) {
        throw new TrackerRejectedError(message);
      }
      throw new Error(message);
    }

    const payload = (await response.json()) as GraphQLResponse<TResult>;
    if (payload.errors?.length) {
      throw errorFrom(payload.errors);
    }
    if (!payload.data) {
      throw new Error('Portal returned no data.');
    }
    return payload.data;
  }

  /** Authenticated request using the stored device token. */
  async function authed<TResult, TVariables>(
    document: TypedDocumentString<TResult, TVariables>,
    variables: TVariables,
  ): Promise<TResult> {
    const token = await config.getToken();
    if (!token) {
      throw new TrackerAuthError('Not signed in.');
    }
    return request(document, variables, token);
  }

  return {
    async login(email: string, password: string, device: DeviceInfo): Promise<LoginResponse> {
      const data = await request(TrackerLoginDocument, { email, password, device }, null);
      return { ...data.trackerLogin, settings: toSettings(data.trackerLogin.settings) };
    },

    /**
     * One batch of this app's error and debug logs for Tech > Logs. Sent signed in or not — a
     * crash on the login screen must still arrive; the token, when there is one, names the
     * user. False when the portal dropped the batch for being over its rate limit.
     */
    async reportClientLogs(input: AppLogBatchInput): Promise<boolean> {
      const data = await request(ReportClientLogsDocument, { input }, await config.getToken());
      return data.reportClientLogs;
    },

    /** Brand identity for the app's chrome. Unauthenticated — the login screen needs it. */
    async fetchBranding(): Promise<Branding> {
      const data = await request(PublicBrandingDocument, {}, null);
      return data.publicBranding;
    },

    /** Rebuilds a remembered session from the stored device token (no password prompt). */
    async trackerMe(): Promise<TrackerMeResponse> {
      return toMe((await authed(TrackerMeDocument, {})).trackerMe);
    },

    /**
     * Keep-alive and settings pull in one call: tells the portal this device is still online
     * and what it currently is, and answers with the portal's current view of this employee,
     * so an admin's change reaches a running app without anyone restarting it.
     */
    async heartbeat(device: DeviceInfo): Promise<TrackerMeResponse> {
      return toMe((await authed(TrackerHeartbeatDocument, { device })).trackerHeartbeat);
    },

    /**
     * The signed-in employee's OWN tracked time. The portal buckets the days by the zone sent,
     * so it must be the same zone the app computed the range in and labels the rows with.
     */
    async fetchMyReport(from: string, to: string, timezone: string): Promise<ReportDay[]> {
      return (await authed(MyTrackerCalendarDocument, { from, to, timezone })).myTrackerCalendar;
    },

    /** One day of the employee's OWN work — totals plus that day's screenshots. */
    async fetchMyDay(start: string, end: string): Promise<DayDetail> {
      return summarizeDay((await authed(MyTrackerDayDocument, { start, end })).myTrackerDay);
    },

    /** Records the zone THIS employee picked. Returns what the portal stored. */
    async setTimezone(timezone: string): Promise<string> {
      return (await authed(TrackerSetTimezoneDocument, { timezone })).trackerSetTimezone.timezone;
    },

    /** The employee's OWN all-time totals. */
    async fetchMyTotals(): Promise<TrackerTotals> {
      return (await authed(MyTrackerTotalsDocument, {})).myTrackerTotals;
    },

    /** Every zone the server resolves — the zone list for a runtime that cannot produce one. */
    async fetchTimezones(): Promise<string[]> {
      return (await authed(TrackerTimezonesDocument, {})).trackerTimezones;
    },

    /**
     * Records the employee's acceptance. `signedName` is their typed signature — WHO signed
     * comes from the device token, never from here.
     */
    async acceptConsent(signedName: string): Promise<void> {
      await authed(TrackerAcceptConsentDocument, { signedName });
    },

    /** Marks the employee in for their own local day — the same record HR's page writes. */
    async markAttendance(status: AttendanceStatus, note: string | null): Promise<Workday> {
      return (await authed(TrackerMarkAttendanceDocument, { status, note })).trackerMarkAttendance;
    },

    /**
     * Opens a session against a project. The portal refuses this until the employee has
     * accepted the disclosure AND marked their attendance — a disabled Start is a courtesy;
     * this is the rule.
     */
    async startSession(startedAt: string, projectId: string, taskId: string): Promise<string> {
      const data = await authed(TrackerStartSessionDocument, { startedAt, projectId, taskId });
      return data.trackerStartSession.id;
    },

    async stopSession(sessionId: string, endedAt: string): Promise<void> {
      await authed(TrackerStopSessionDocument, { sessionId, endedAt });
    },

    /** Tickets the employee may book against on a project, their own first. */
    async fetchTasks(projectId: string): Promise<TrackerTask[]> {
      return (await authed(TrackerTaskOptionsDocument, { projectId })).trackerTaskOptions;
    },

    async syncIntervals(sessionId: string, intervals: IntervalPayload[]): Promise<void> {
      await authed(TrackerSyncIntervalsDocument, { sessionId, intervals });
    },

    async uploadScreenshot(input: ScreenshotPayload): Promise<void> {
      await authed(TrackerUploadScreenshotDocument, { input });
    },

    /** The employee's OWN claims for work done away from the tracker. */
    async fetchManualEntries(from: string, to: string): Promise<ManualEntry[]> {
      return (await authed(MyTrackerManualEntriesDocument, { from, to })).myTrackerManualEntries;
    },

    /** Files a claim. It lands PENDING and counts for nothing until a manager approves it. */
    async createManualEntry(draft: ManualEntryDraft): Promise<ManualEntry> {
      const data = await authed(CreateTrackerManualEntryDocument, {
        input: {
          projectId: draft.projectId === '' ? null : draft.projectId,
          taskId: draft.taskId === '' ? null : draft.taskId,
          startedAt: draft.startedAt,
          endedAt: draft.endedAt,
          note: draft.note,
        },
      });
      return data.createTrackerManualEntry;
    },

    /** Takes back a claim that is still pending. The portal refuses once it has been decided. */
    async withdrawManualEntry(id: string): Promise<void> {
      await authed(WithdrawTrackerManualEntryDocument, { id });
    },

    /** The employee's OWN thread with the tracker desk, or the announcements sent to them. */
    async fetchMessages(kind: TrackerMessageKind): Promise<TrackerMessage[]> {
      return (await authed(MyTrackerMessagesDocument, { kind })).myTrackerMessages;
    },

    /** Posts one line onto the employee's own thread. The portal decides who it is from. */
    async sendMessage(body: string): Promise<TrackerMessage> {
      return (await authed(SendMyTrackerMessageDocument, { body })).sendMyTrackerMessage;
    },

    /** Marks what was addressed to this employee as read. Answers how many that was. */
    async markMessagesRead(kind: TrackerMessageKind): Promise<number> {
      return (await authed(MarkMyTrackerMessagesReadDocument, { kind })).markMyTrackerMessagesRead;
    },

    /**
     * The newest tracker release carrying an installer for `platform`, or null before one
     * exists. What an app's own update check compares its version against.
     */
    async fetchLatestRelease(platform: string): Promise<LatestRelease | null> {
      return (await authed(TrackerLatestReleaseDocument, { platform })).trackerLatestRelease;
    },

    /** Records what the employee says they are doing. Scoped to their own row by the token. */
    async setPresence(status: PresenceStatus, note: string): Promise<PresenceState> {
      return (await authed(SetMyTrackerPresenceDocument, { status, note })).setMyTrackerPresence;
    },
  };
}

export type PortalClient = ReturnType<typeof createPortalClient>;
