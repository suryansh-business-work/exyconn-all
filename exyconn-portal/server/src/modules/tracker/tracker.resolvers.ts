import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertRole, assertAuthenticated } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { githubActions } from '../../utils/github';
import { assertTrackerDevice } from './tracker.auth';
import {
  trackerDeviceService,
  type DeviceInput,
  type IntervalInput,
  type ScreenshotInput,
} from './tracker.device.service';
import { trackerAdminService } from './tracker.admin.service';
import {
  getTrackerSettings,
  updateTrackerSettings,
  type TrackerSettingsInput,
} from './tracker.settings.service';

const TRACKER_ROLES = [ROLES.TRACKER];

type LeanDoc = { _id: unknown };

/** The desktop state payload, shared by `trackerMe` and `trackerHeartbeat`. */
type DeviceState = Awaited<ReturnType<typeof trackerDeviceService.me>>;

/** Serializes that payload with `_id -> id`, so both resolvers answer identically. */
function serializeDeviceState(state: DeviceState) {
  return {
    user: withId(state.user as LeanDoc),
    consentRequired: state.consentRequired,
    settings: withId(state.settings),
    timezone: state.timezone,
    workProfile: state.workProfile,
    workday: state.workday,
    projects: state.projects,
    consentPolicy: state.consentPolicy,
  };
}

/** Serializes the day payload (four independent lists) with `_id -> id`. */
async function serializeDay(day: {
  intervals: LeanDoc[];
  screenshots: LeanDoc[];
  sessions: LeanDoc[];
  appUsage: unknown[];
}) {
  return {
    intervals: withIds(day.intervals),
    screenshots: withIds(day.screenshots),
    sessions: withIds(day.sessions),
    appUsage: day.appUsage,
  };
}

export const trackerResolvers = {
  Query: {
    trackerSettings: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, TRACKER_ROLES);
      return withId(await getTrackerSettings());
    },
    trackerAccessList: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, TRACKER_ROLES);
      return withIds((await trackerAdminService.listAccess()) as LeanDoc[]);
    },
    trackerDevices: async (_p: unknown, { userId }: { userId?: string }, ctx: GraphQLContext) => {
      assertRole(ctx, TRACKER_ROLES);
      return withIds((await trackerAdminService.listDevices(userId)) as LeanDoc[]);
    },
    trackerCalendar: async (
      _p: unknown,
      { userId, from, to, timezone }: { userId: string; from: Date; to: Date; timezone: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, TRACKER_ROLES);
      return trackerAdminService.calendar(userId, from, to, timezone);
    },
    trackerDay: async (
      _p: unknown,
      { userId, start, end }: { userId: string; start: Date; end: Date },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, TRACKER_ROLES);
      return serializeDay(await trackerAdminService.day(userId, start, end));
    },
    trackerTotals: async (_p: unknown, { userId }: { userId: string }, ctx: GraphQLContext) => {
      assertRole(ctx, TRACKER_ROLES);
      return trackerAdminService.totals(userId);
    },

    /**
     * Latest desktop installers. Guarded by a session only, not the TRACKER role:
     * the people who need to install the app are the employees being tracked, not
     * the managers who administer it.
     */
    trackerLatestRelease: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      return githubActions.latestTrackerRelease();
    },

    /** Desktop app rehydrating a remembered (non-expiring) session. */
    trackerMe: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const { userId, deviceId } = await assertTrackerDevice(ctx);
      return serializeDeviceState(await trackerDeviceService.me(userId, deviceId));
    },
    /** Desktop app — the signed-in employee's own totals. */
    myTrackerTotals: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const { userId } = await assertTrackerDevice(ctx);
      return trackerAdminService.totals(userId);
    },

    myTrackerAccess: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const user = assertAuthenticated(ctx);
      const list = await trackerAdminService.listAccess();
      const mine = list.find((access) => access.userId === user.id);
      return mine ? withId(mine) : null;
    },
    myTrackerCalendar: async (
      _p: unknown,
      { from, to, timezone }: { from: Date; to: Date; timezone: string },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      return trackerAdminService.calendar(user.id, from, to, timezone);
    },
    myTrackerDay: async (
      _p: unknown,
      { start, end }: { start: Date; end: Date },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      return serializeDay(await trackerAdminService.day(user.id, start, end));
    },
  },

  Mutation: {
    // ── Portal (TRACKER role) ──────────────────────────────────────────
    grantTrackerAccess: async (
      _p: unknown,
      { userId }: { userId: string },
      ctx: GraphQLContext,
    ) => {
      const actor = assertRole(ctx, TRACKER_ROLES);
      return withId((await trackerAdminService.grantAccess(userId, actor.id)) as LeanDoc);
    },
    revokeTrackerAccess: async (
      _p: unknown,
      { userId }: { userId: string },
      ctx: GraphQLContext,
    ) => {
      const actor = assertRole(ctx, TRACKER_ROLES);
      return withId((await trackerAdminService.revokeAccess(userId, actor.id)) as LeanDoc);
    },
    revokeTrackerDevice: async (
      _p: unknown,
      { deviceId }: { deviceId: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, TRACKER_ROLES);
      return withId((await trackerAdminService.revokeDevice(deviceId)) as LeanDoc);
    },
    updateTrackerSettings: async (
      _p: unknown,
      { input }: { input: TrackerSettingsInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, TRACKER_ROLES);
      return withId(await updateTrackerSettings(input));
    },

    // ── Desktop app ────────────────────────────────────────────────────
    trackerLogin: async (
      _p: unknown,
      { email, password, device }: { email: string; password: string; device: DeviceInput },
    ) => {
      const result = await trackerDeviceService.login(email, password, device);
      return {
        token: result.token,
        user: withId(result.user),
        consentRequired: result.consentRequired,
        settings: withId(result.settings),
      };
    },
    trackerAcceptConsent: async (
      _p: unknown,
      { signedName }: { signedName?: string | null },
      ctx: GraphQLContext,
    ) => {
      const { userId } = await assertTrackerDevice(ctx);
      return trackerDeviceService.acceptConsent(userId, signedName);
    },
    /** Marks the caller in for their own local day — the device token decides whose day. */
    trackerMarkAttendance: async (
      _p: unknown,
      { status, note }: { status: string; note?: string | null },
      ctx: GraphQLContext,
    ) => {
      const { userId, deviceId } = await assertTrackerDevice(ctx);
      const state = await trackerDeviceService.me(userId, deviceId);
      return trackerDeviceService.markAttendance(userId, state.timezone, status, note);
    },
    /** Keep-alive: touches lastSeenAt and answers with the state the app should adopt. */
    trackerHeartbeat: async (
      _p: unknown,
      { device }: { device?: DeviceInput },
      ctx: GraphQLContext,
    ) => {
      const { userId, deviceId } = await assertTrackerDevice(ctx);
      return serializeDeviceState(await trackerDeviceService.heartbeat(userId, deviceId, device));
    },
    trackerStartSession: async (
      _p: unknown,
      { startedAt, projectId }: { startedAt: Date; projectId?: string | null },
      ctx: GraphQLContext,
    ) => {
      const { userId, deviceId } = await assertTrackerDevice(ctx);
      return withId(
        await trackerDeviceService.startSession(userId, deviceId, startedAt, projectId),
      );
    },
    trackerStopSession: async (
      _p: unknown,
      { sessionId, endedAt }: { sessionId: string; endedAt: Date },
      ctx: GraphQLContext,
    ) => {
      const { userId } = await assertTrackerDevice(ctx);
      return withId(
        (await trackerDeviceService.stopSession(userId, sessionId, endedAt)) as LeanDoc,
      );
    },
    trackerSyncIntervals: async (
      _p: unknown,
      { sessionId, intervals }: { sessionId: string; intervals: IntervalInput[] },
      ctx: GraphQLContext,
    ) => {
      const { userId } = await assertTrackerDevice(ctx);
      return trackerDeviceService.syncIntervals(userId, sessionId, intervals);
    },
    trackerUploadScreenshot: async (
      _p: unknown,
      { input }: { input: ScreenshotInput },
      ctx: GraphQLContext,
    ) => {
      const { userId } = await assertTrackerDevice(ctx);
      return withId((await trackerDeviceService.uploadScreenshot(userId, input)) as LeanDoc);
    },
    /** The device token decides whose row is written, so this can only ever set the caller's. */
    trackerSetTimezone: async (
      _p: unknown,
      { timezone }: { timezone: string },
      ctx: GraphQLContext,
    ) => {
      const { userId } = await assertTrackerDevice(ctx);
      return withId((await trackerDeviceService.setTimezone(userId, timezone)) as LeanDoc);
    },
  },
};
