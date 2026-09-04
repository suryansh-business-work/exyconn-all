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
import { trackerBillingService } from './tracker.billing.service';
import { trackerManualService, type ManualEntryInput } from './tracker.manual.service';
import { trackerTimeLogService } from './tracker.timelog.service';
import { trackerWorkdayService } from './tracker.workday.service';
import type { ManualEntryStatus } from './tracker.constants';
import {
  getTrackerSettings,
  updateTrackerSettings,
  type TrackerSettingsInput,
} from './tracker.settings.service';

const TRACKER_ROLES = [ROLES.TRACKER];

/** How many tickets the desktop picker offers. A board can have thousands; a menu cannot. */
const TASK_PICKER_LIMIT = 100;

/**
 * Who may read a project's time log.
 *
 * Hours against a ticket are how a project is run, so the PROJECTS role is enough — this is
 * the module that owns the board the ticket lives on.
 */
const TIME_LOG_ROLES = [ROLES.PROJECTS, ROLES.TRACKER];

/**
 * Who may open the screenshots behind it.
 *
 * Deliberately narrower. A screenshot is a picture of an employee's screen, not a project
 * metric, and putting the tracker's evidence inside the Projects module would otherwise
 * widen who can watch staff from "the people who administer monitoring" to "anyone with a
 * board". `assertRole` already lets ADMIN through every list.
 */
const SCREENSHOT_ROLES = [ROLES.TRACKER];

/** Whether this caller passes the narrower screenshot check, without throwing if they do not. */
function canViewScreenshots(ctx: GraphQLContext): boolean {
  const roles = ctx.user?.roles ?? [];
  return roles.includes(ROLES.ADMIN) || roles.includes(ROLES.TRACKER);
}

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
    /** What the workspace's tracked time is worth, priced from HR's salary structures. */
    trackerBilling: async (
      _p: unknown,
      { from, to }: { from: Date; to: Date },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, TRACKER_ROLES);
      return trackerBillingService.billing(from, to);
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

    trackerManualEntries: async (
      _p: unknown,
      { userId, from, to }: { userId: string; from: Date; to: Date },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, TRACKER_ROLES);
      return withIds(
        await trackerManualService.withNames(await trackerManualService.list(userId, from, to)),
      );
    },
    trackerPendingManualEntries: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, TRACKER_ROLES);
      return withIds(
        await trackerManualService.withNames(await trackerManualService.listPending()),
      );
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
    trackerProjectOptions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      return trackerWorkdayService.projects();
    },
    trackerTaskOptions: async (
      _p: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      return trackerWorkdayService.tasksFor(user.id, projectId, TASK_PICKER_LIMIT);
    },

    projectTimeLog: async (
      _p: unknown,
      { projectId, from, to }: { projectId: string; from: Date; to: Date },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, TIME_LOG_ROLES);
      const rows = await trackerTimeLogService.summary(projectId, from, to);
      return {
        rows,
        totalActiveMs: rows.reduce((sum, row) => sum + row.activeMs, 0),
        totalManualMs: rows.reduce((sum, row) => sum + row.manualMs, 0),
        canViewScreenshots: canViewScreenshots(ctx),
      };
    },
    projectTimeLogSessions: async (
      _p: unknown,
      {
        projectId,
        from,
        to,
        userId,
        taskId,
      }: { projectId: string; from: Date; to: Date; userId?: string; taskId?: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, TIME_LOG_ROLES);
      return trackerTimeLogService.sessions(projectId, from, to, userId, taskId);
    },
    projectTimeLogScreenshots: async (
      _p: unknown,
      { projectId, sessionId }: { projectId: string; sessionId: string },
      ctx: GraphQLContext,
    ) => {
      // The narrow check: a board role is not a licence to look at somebody's screen.
      assertRole(ctx, SCREENSHOT_ROLES);
      return trackerTimeLogService.screenshots(projectId, sessionId);
    },
    myTrackerManualEntries: async (
      _p: unknown,
      { from, to }: { from: Date; to: Date },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      // Scoped to the caller's own id, never one supplied by the client.
      return withIds(await trackerManualService.list(user.id, from, to));
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
    reviewTrackerManualEntry: async (
      _p: unknown,
      { id, status, reviewNote }: { id: string; status: ManualEntryStatus; reviewNote?: string },
      ctx: GraphQLContext,
    ) => {
      const reviewer = assertRole(ctx, TRACKER_ROLES);
      return withId(await trackerManualService.review(id, status, reviewer.id, reviewNote));
    },

    createTrackerManualEntry: async (
      _p: unknown,
      { input }: { input: ManualEntryInput & { projectId?: string | null } },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      // The project is resolved here so the manual service stays free of the workday
      // service, which itself reads approved manual time — see BookedProject.
      const project = await trackerWorkdayService.bookableProject(input.projectId);
      const task = await trackerWorkdayService.bookableTask(project?.id ?? '', input.taskId);
      return withId(await trackerManualService.create(user.id, input, project, task));
    },
    withdrawTrackerManualEntry: async (
      _p: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      const user = assertAuthenticated(ctx);
      return trackerManualService.withdraw(id, user.id);
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
      {
        startedAt,
        projectId,
        taskId,
      }: { startedAt: Date; projectId?: string | null; taskId?: string | null },
      ctx: GraphQLContext,
    ) => {
      const { userId, deviceId } = await assertTrackerDevice(ctx);
      return withId(
        await trackerDeviceService.startSession(userId, deviceId, startedAt, projectId, taskId),
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
