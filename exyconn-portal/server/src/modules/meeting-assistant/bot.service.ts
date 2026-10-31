import { organizationOf, runAsPlatform, runForOrganization } from '../../lib/tenant';
import { badRequest, forbidden, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { resolveEffectiveTimezone } from '../../utils/timezone';
import type { GraphQLContext } from '../../middleware/auth';
import { UserModel } from '../admin/user.model';
import { houseTimezone } from '../analytics/analytics.metrics';
import { botConsentMessage } from './bot.messages';
import { startBotSession } from './extension.auth';
import { recordMaActivity } from './ma.activity';
import {
  FINAL_BOT_STATUSES,
  type MaBotSource,
  type MaBotStatus,
  type MaLanguage,
} from './ma.enums';
import type { MaActor, MaScopeFilter } from './ma.access';
import { logMaEvent } from './events.service';
import { MEET_CODE } from './meeting.lifecycle';
import { MaBotDispatchModel, MaMeetingModel } from './models';
import { getMaSettings } from './settings.service';

const MEET_HOST = 'meet.google.com';
/** A bot that has not reported for this long has crashed or lost its connection. */
const SILENT_BOT_MS = 5 * 60_000;
/** A trip nobody picked up this long after its start is given up. */
const UNCLAIMED_BOT_MS = 30 * 60_000;
const LIVE_STATUSES: MaBotStatus[] = ['JOINING', 'WAITING_ADMIT', 'IN_CALL'];
/** What the bot service may report; QUEUED, JOINING and CANCELLED are the server's to set. */
const REPORTABLE: ReadonlySet<string> = new Set(['WAITING_ADMIT', 'IN_CALL', 'DONE', 'FAILED']);

export interface NewDispatch {
  ownerId: string;
  ownerName: string;
  meetingCode: string;
  title: string;
  source: MaBotSource;
  calendarEventId: string | null;
  joinAt: Date;
}

/** A call's path before its code: `/`, or `/meet/` where Meet now redirects calls. */
const MEET_CALL_PATH = /^\/(?:meet\/)?/;

/** The Meet code of a meet.google.com link, or a bad-request error. */
export function meetCodeOfUrl(raw: string): string {
  let url: URL | null;
  try {
    url = new URL(raw.trim());
  } catch {
    url = null;
  }
  const code = url?.pathname.replace(MEET_CALL_PATH, '').toLowerCase() ?? '';
  if (url?.protocol !== 'https:' || url.hostname !== MEET_HOST || !MEET_CODE.test(code)) {
    badRequest('Paste a Google Meet link, like https://meet.google.com/abc-defg-hij.');
  }
  return code;
}

/** Queues a trip. Throws a bad request when this owner's bot is already bound for the call. */
export async function createDispatch(input: NewDispatch) {
  try {
    const created = await MaBotDispatchModel.create({
      ...input,
      meetUrl: `https://${MEET_HOST}/${input.meetingCode}`,
    });
    return created.toObject();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      badRequest('The bot is already on its way to this call.');
    }
    throw error;
  }
}

/** Sends the bot into a call now, for the person asking. */
export async function sendBot(
  ctx: GraphQLContext,
  actor: MaActor,
  input: { meetUrl: string; title?: string | null },
) {
  const settings = await getMaSettings();
  if (!settings.botEnabled) {
    forbidden('The meeting bot is switched off for your company.');
  }
  const meetingCode = meetCodeOfUrl(input.meetUrl);
  const recording = await MaMeetingModel.exists({
    ownerId: actor.id,
    meetingCode,
    status: 'ACTIVE',
    captureState: 'RECORDING',
  });
  if (recording) {
    badRequest('Your extension is already recording this call. Stop it before sending the bot.');
  }
  const dispatch = await createDispatch({
    ownerId: actor.id,
    ownerName: actor.name,
    meetingCode,
    title: (input.title ?? '').trim().slice(0, 300),
    source: 'MANUAL',
    calendarEventId: null,
    joinAt: new Date(),
  });
  await recordMaActivity(ctx, actor, {
    type: 'BOT_SENT',
    action: 'CREATE',
    summary: `Sent ${settings.botName} to the call ${meetingCode}`,
  });
  return dispatch;
}

/** Calls the bot back: a queued trip never starts, a running one leaves at its next report. */
export async function cancelBot(ctx: GraphQLContext, actor: MaActor, id: string, all: boolean) {
  const dispatch = await MaBotDispatchModel.findById(id).lean();
  if (!dispatch || (!all && dispatch.ownerId !== actor.id)) {
    notFound('Bot');
  }
  if (!dispatch.active) {
    return dispatch;
  }
  const cancelled = await MaBotDispatchModel.findOneAndUpdate(
    { _id: dispatch._id, active: true },
    { $set: { status: 'CANCELLED', active: false, finishedAt: new Date() } },
    { new: true },
  ).lean();
  await recordMaActivity(ctx, actor, {
    type: 'BOT_CANCELLED',
    action: 'UPDATE',
    summary: `Called the meeting bot back from the call ${dispatch.meetingCode}`,
  });
  return cancelled ?? dispatch;
}

/** The latest trips the scope may see, newest first. */
export function botDispatches(scope: MaScopeFilter) {
  const filter = scope.viewerIds ? { ownerId: scope.viewerIds } : {};
  return MaBotDispatchModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
}

/** Ends trips whose bot went silent, and trips nobody picked up in time. Returns how many. */
export async function failStuckBots(now = new Date()): Promise<number> {
  const finish = { active: false, finishedAt: now, status: 'FAILED' };
  const silent = await MaBotDispatchModel.updateMany(
    {
      active: true,
      status: { $in: LIVE_STATUSES },
      lastSeenAt: { $lt: new Date(now.getTime() - SILENT_BOT_MS) },
    },
    { $set: { ...finish, error: 'The bot stopped reporting.' } },
  );
  const unclaimed = await MaBotDispatchModel.updateMany(
    { status: 'QUEUED', joinAt: { $lt: new Date(now.getTime() - UNCLAIMED_BOT_MS) } },
    { $set: { ...finish, error: 'No bot was free to join the call.' } },
  );
  return silent.modifiedCount + unclaimed.modifiedCount;
}

export interface BotAssignment {
  dispatchId: string;
  meetUrl: string;
  meetingCode: string;
  title: string;
  botName: string;
  consentMessage: string;
  timezone: string;
  maxMeetingMinutes: number;
  saveRecordings: boolean;
  accessToken: string;
  refreshToken: string;
}

/** Everything the bot needs for one claimed trip, in the owner's company. */
async function assignmentFor(
  dispatch: { _id: unknown; ownerId: string; ownerName: string; meetUrl: string },
  rest: { meetingCode: string; title: string },
  organizationId: string,
): Promise<BotAssignment> {
  const settings = await getMaSettings();
  if (!settings.enabled || !settings.botEnabled) {
    throw new Error('The meeting bot is switched off for this company.');
  }
  const owner = await UserModel.findById(dispatch.ownerId).select('timezone').lean();
  const tokens = await startBotSession(dispatch.ownerId, organizationId, settings.botName);
  return {
    dispatchId: String(dispatch._id),
    meetUrl: dispatch.meetUrl,
    ...rest,
    botName: settings.botName,
    consentMessage: botConsentMessage(
      settings.preferredLanguage as MaLanguage,
      settings.botName,
      dispatch.ownerName,
    ),
    timezone: resolveEffectiveTimezone({
      employeeTimezone: owner?.timezone,
      defaultTimezone: await houseTimezone(),
    }),
    maxMeetingMinutes: settings.maxMeetingMinutes,
    saveRecordings: settings.saveRecordings,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  };
}

/** Takes the next due trip, across every company, or null when none is due. */
export async function claimBotDispatch(now = new Date()): Promise<BotAssignment | null> {
  const claimed = await runAsPlatform(() =>
    MaBotDispatchModel.findOneAndUpdate(
      { status: 'QUEUED', joinAt: { $lte: now } },
      { $set: { status: 'JOINING', claimedAt: now, lastSeenAt: now } },
      { sort: { joinAt: 1 }, new: true },
    ).lean(),
  );
  const organizationId = claimed ? organizationOf(claimed) : null;
  if (!claimed || !organizationId) {
    return null;
  }
  try {
    return await runForOrganization(organizationId, () =>
      assignmentFor(claimed, claimed, organizationId),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The bot could not be prepared.';
    logger.warn({ dispatchId: String(claimed._id), err: message }, 'Meeting bot claim failed');
    await reportBotStatus(String(claimed._id), { status: 'FAILED', error: message });
    return null;
  }
}

export interface BotReport {
  status: string;
  meetingId?: string | null;
  error?: string | null;
}

/** The bot's report on a trip. Returns whether it should leave: cancelled, or unknown. */
export async function reportBotStatus(id: string, report: BotReport): Promise<{ leave: boolean }> {
  if (!REPORTABLE.has(report.status)) {
    badRequest('Unknown bot status.');
  }
  const status = report.status as MaBotStatus;
  const dispatch = await runAsPlatform(() => MaBotDispatchModel.findById(id).lean());
  const organizationId = dispatch ? organizationOf(dispatch) : null;
  if (!dispatch || !organizationId || FINAL_BOT_STATUSES.has(dispatch.status as MaBotStatus)) {
    return { leave: true };
  }
  const final = FINAL_BOT_STATUSES.has(status);
  await runAsPlatform(() =>
    MaBotDispatchModel.updateOne(
      { _id: dispatch._id, active: true },
      {
        $set: {
          status,
          lastSeenAt: new Date(),
          meetingId: report.meetingId ?? dispatch.meetingId,
          error: (report.error ?? '').slice(0, 500),
          ...(final ? { active: false, finishedAt: new Date() } : {}),
        },
      },
    ),
  );
  if (status !== dispatch.status) {
    await runForOrganization(organizationId, () =>
      logMaEvent({
        type: `BOT_${status}`,
        message: report.error
          ? `Meeting bot ${status.toLowerCase()}: ${report.error}`
          : `Meeting bot ${status.toLowerCase()} (${dispatch.meetingCode})`,
        details: { dispatchId: id, meetingId: report.meetingId ?? null },
      }),
    );
  }
  return { leave: final };
}
