import type { GraphQLContext } from '../../middleware/auth';
import { ROLES } from '../../constants/roles';
import { assertRole, assertAuthenticated } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
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

    /** Desktop app rehydrating a remembered (non-expiring) session. */
    trackerMe: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const { userId } = await assertTrackerDevice(ctx);
      const result = await trackerDeviceService.me(userId);
      return {
        user: withId(result.user as LeanDoc),
        consentRequired: result.consentRequired,
        settings: withId(result.settings),
      };
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
    trackerAcceptConsent: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const { userId } = await assertTrackerDevice(ctx);
      return trackerDeviceService.acceptConsent(userId);
    },
    trackerHeartbeat: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      const { deviceId } = await assertTrackerDevice(ctx);
      return trackerDeviceService.heartbeat(deviceId);
    },
    trackerStartSession: async (
      _p: unknown,
      { startedAt }: { startedAt: Date },
      ctx: GraphQLContext,
    ) => {
      const { userId, deviceId } = await assertTrackerDevice(ctx);
      return withId(await trackerDeviceService.startSession(userId, deviceId, startedAt));
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
  },
};
