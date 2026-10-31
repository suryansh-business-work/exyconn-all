import { Types } from 'mongoose';
import { env } from '../../../../src/config/env';
import { ROLES } from '../../../../src/constants/roles';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { sendTemplateEmail } from '../../../../src/modules/email/email.service';
import {
  MaActionItemModel,
  MaBotDispatchModel,
  MaDecisionModel,
  MaMeetingModel,
  MaNotesModel,
  MaSettingsModel,
} from '../../../../src/modules/meeting-assistant/models';
import {
  ensureMeetingBotDemo,
  meetingBotDemoResolvers,
  meetingBotDemoTypeDefs,
  startMeetingBotDemoSweep,
} from '../../../../src/modules/meeting-bot-demo';
import { MeetingBotDemoTripModel } from '../../../../src/modules/meeting-bot-demo/meetingBotDemo.model';
import { meetingDemo } from '../../../../src/modules/meeting-bot-demo/meetingBotDemo.org';
import { runMeetingBotDemoSweep } from '../../../../src/modules/meeting-bot-demo/meetingBotDemo.sweep';
import { consentTextOf } from '../../../../src/modules/meeting-bot-demo/meetingBotDemo.service';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { logger } from '../../../../src/utils/logger';

jest.mock('../../../../src/modules/email/email.service', () => ({
  ...jest.requireActual('../../../../src/modules/email/email.service'),
  sendTemplateEmail: jest.fn(),
}));

const send = sendTemplateEmail as jest.Mock;
const { Query, Mutation } = meetingBotDemoResolvers;
const MEET = 'https://meet.google.com/abc-defg-hij';
const DAY_MS = 24 * 60 * 60 * 1000;

const visitorCtx = (id = 'v1', email = 'asha@example.com', company = 'Acme'): GraphQLContext => ({
  user: null,
  ip: '203.0.113.9',
  demoVisitor: {
    id,
    name: 'Asha',
    email,
    phone: '',
    company,
    organizationId: new Types.ObjectId().toHexString(),
  },
});
const asha = visitorCtx();
const ravi = visitorCtx('v2', 'ravi@example.com', '');

const send$ = (ctx: GraphQLContext, meetUrl = MEET, consent = true) =>
  Mutation.sendMeetingBotDemo(undefined, { meetUrl, consent }, ctx);

/** Runs inside the demo company, where every demo record lives. */
async function inDemo<T>(work: () => Promise<T>): Promise<T> {
  const demo = await meetingDemo();
  return runForOrganization(demo.organizationId, work);
}

/** Writes the meeting the bot recorded for a trip, and its notes, as the worker would. */
async function recordMeeting(tripId: string, withNotes = true) {
  return inDemo(async () => {
    const trip = await MeetingBotDemoTripModel.findById(tripId).lean();
    const meeting = await MaMeetingModel.create({
      sessionKey: `bot:${tripId}`,
      meetingCode: trip?.meetingCode,
      url: MEET,
      title: 'Demo call · Acme',
      ownerId: 'demo',
      ownerName: 'Notetaker',
      ownerEmail: 'notetaker@example.com',
      viewerIds: [],
      startedAt: new Date(Date.now() - 30 * 60_000),
      endedAt: new Date(),
      status: 'ENDED',
      summaryStatus: withNotes ? 'READY' : 'RUNNING',
    });
    const meetingId = String(meeting._id);
    await MaBotDispatchModel.updateOne(
      { _id: trip?.dispatchId },
      { $set: { meetingId, status: 'DONE', active: false, finishedAt: new Date() } },
    );
    if (withNotes) {
      const content = {
        overview: 'Overview only',
        executiveSummary: '',
        discussionPoints: ['Pricing'],
      };
      await MaNotesModel.create({
        meetingId,
        style: 'DETAILED',
        model: 'gpt-4o',
        generatedAt: new Date(),
        original: content,
        content,
      });
      await MaDecisionModel.create({ meetingId, fingerprint: 'f', text: 'Go with plan B' });
      await MaActionItemModel.create([
        { meetingId, title: 'Send quote', assignedTo: 'Asha', dueText: 'Friday', createdById: 's' },
        {
          meetingId,
          title: 'Book demo',
          dueDate: new Date('2026-11-06T00:00:00Z'),
          createdById: 's',
        },
        { meetingId, title: 'Dropped', status: 'CANCELLED', createdById: 's' },
      ]);
    }
    return meetingId;
  });
}

beforeEach(() => {
  jest.replaceProperty(env.meetAssistant, 'botToken', 'bot-secret');
  send.mockResolvedValue(undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('the demo company', () => {
  it('is made once, with an account nobody signs in to and the assistant set up for the demo', async () => {
    await ensureMeetingBotDemo();
    await ensureMeetingBotDemo();
    const first = await meetingDemo();
    const companies = await runAsPlatform(() =>
      OrganizationModel.find({ slug: 'exyconn-meeting-bot-demo' }).lean(),
    );
    expect(companies).toHaveLength(1);
    expect(String(companies[0]._id)).toBe(first.organizationId);
    const account = await runAsPlatform(() => UserModel.findById(first.accountId).lean());
    expect(account?.roles).toEqual([ROLES.EMPLOYEE, ROLES.AI]);
    const settings = await inDemo(() => MaSettingsModel.findOne({ key: 'global' }).lean());
    expect(settings).toMatchObject({
      botEnabled: true,
      autoEmail: false,
      emailParticipants: false,
      audioRetentionDays: env.demos.meetingBot.retentionDays,
      transcriptRetentionDays: env.demos.meetingBot.retentionDays,
      maxMeetingMinutes: env.demos.meetingBot.maxMeetingMinutes,
    });
  });

  it('refuses to adopt an account another company owns, and boot carries on', async () => {
    const other = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Other', slug: 'other', currency: 'USD' }),
    );
    await runForOrganization(String(other._id), () =>
      UserModel.create({
        name: 'Squatter',
        email: 'notetaker@exyconn-meeting-bot-demo.example',
        passwordHash: 'x',
        roles: [ROLES.EMPLOYEE],
      }),
    );
    const error = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    await ensureMeetingBotDemo();
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Meeting bot demo could not be prepared',
    );
    await expect(meetingDemo()).rejects.toThrow(/belongs to another company/);
  });
});

describe('who may use the demo', () => {
  it('turns away a caller who is neither a demo visitor nor an employee', async () => {
    await expect(Query.meetingBotDemoInfo(undefined, {}, { user: null })).rejects.toThrow();
  });

  it('lets an employee in under their own key and name', async () => {
    const user = await runAsPlatform(() =>
      UserModel.create({
        name: 'Meera',
        email: 'meera@exyconn.com',
        passwordHash: 'x',
        roles: [ROLES.EMPLOYEE],
      }),
    );
    const ctx: GraphQLContext = {
      user: { id: String(user._id), email: user.email, roles: [ROLES.EMPLOYEE] },
    };
    const trip = await send$(ctx);
    const row = await inDemo(() => MeetingBotDemoTripModel.findById(trip.id).lean());
    expect(row).toMatchObject({
      callerKey: `user:${String(user._id)}`,
      callerName: 'Meera',
      callerEmail: 'meera@exyconn.com',
      ip: '',
    });
  });
});

describe('sending the bot', () => {
  it('shows the limits, the terms and that the bot is ready', async () => {
    const info = await Query.meetingBotDemoInfo(undefined, {}, asha);
    expect(info).toMatchObject({
      enabled: true,
      botName: 'Exyconn Notetaker',
      tripsPerDay: env.demos.meetingBot.tripsPerDay,
      tripsLeftToday: env.demos.meetingBot.tripsPerDay,
      consentText: consentTextOf('Exyconn Notetaker'),
    });
    expect(info.consentText).toContain(`${env.demos.meetingBot.retentionDays} days`);
  });

  it('says the demo is off while the bot service has no secret, and refuses to send', async () => {
    jest.replaceProperty(env.meetAssistant, 'botToken', '');
    expect((await Query.meetingBotDemoInfo(undefined, {}, asha)).enabled).toBe(false);
    await expect(send$(asha)).rejects.toThrow('not set up on this server');
  });

  it('refuses without agreement to the recording terms, or for a link that is not Meet', async () => {
    await expect(send$(asha, MEET, false)).rejects.toThrow('Agree to the recording terms');
    await expect(send$(asha, 'https://zoom.us/j/1')).rejects.toThrow();
    await expect(send$(asha, 'https://meet.google.com/other/abc-defg-hij')).rejects.toThrow(
      'Paste a Google Meet link',
    );
    expect(await inDemo(() => MeetingBotDemoTripModel.countDocuments())).toBe(0);
  });

  it('takes the /meet/ link Meet now shows in the address bar', async () => {
    const trip = await send$(asha, 'https://meet.google.com/meet/abc-defg-hij?authuser=0');
    expect(trip).toMatchObject({ meetingCode: 'abc-defg-hij', meetUrl: MEET });
  });

  it('queues the bot in the demo company, keeps the terms agreed to and audits it', async () => {
    const trip = await send$(asha);
    expect(trip).toMatchObject({
      meetingCode: 'abc-defg-hij',
      meetUrl: MEET,
      status: 'QUEUED',
      summaryStatus: 'NOT_STARTED',
      summary: null,
      purged: false,
      emailedAt: null,
    });
    const demo = await meetingDemo();
    const dispatch = await inDemo(() => MaBotDispatchModel.findOne().lean());
    expect(dispatch).toMatchObject({
      ownerId: demo.accountId,
      ownerName: 'Asha',
      source: 'MANUAL',
    });
    expect(dispatch?.title).toBe('Demo call · Acme');
    const row = await inDemo(() => MeetingBotDemoTripModel.findById(trip.id).lean());
    expect(row?.consentText).toBe(consentTextOf('Exyconn Notetaker'));
    expect(row?.ip).toBe('203.0.113.9');
    const purgeIn = (row?.purgeAfter.getTime() ?? 0) - Date.now();
    expect(Math.round(purgeIn / DAY_MS)).toBe(env.demos.meetingBot.retentionDays);
    const audit = await inDemo(() => AuditLogModel.findOne({ module: 'Meeting bot demo' }).lean());
    expect(audit).toMatchObject({
      action: 'CREATE',
      actorId: 'visitor:v1',
      actorEmail: 'asha@example.com',
    });
  });

  it('names the call plainly for a visitor with no company', async () => {
    await send$(ravi);
    const dispatch = await inDemo(() => MaBotDispatchModel.findOne().lean());
    expect(dispatch?.title).toBe('Demo call');
  });

  it('stops a visitor at the daily limit, counting only their own trips', async () => {
    jest.replaceProperty(env.demos.meetingBot, 'tripsPerDay', 1);
    await send$(asha);
    expect((await Query.meetingBotDemoInfo(undefined, {}, asha)).tripsLeftToday).toBe(0);
    await expect(send$(asha, 'https://meet.google.com/xyz-abcd-efg')).rejects.toThrow(
      'used today’s demo calls',
    );
    await expect(send$(ravi, 'https://meet.google.com/xyz-abcd-efg')).resolves.toBeTruthy();
  });
});

describe('a visitor’s trips', () => {
  it('lists only their own, newest first, and hides everybody else’s', async () => {
    const mine = await send$(asha);
    const theirs = await send$(ravi, 'https://meet.google.com/xyz-abcd-efg');
    const listed = await Query.meetingBotDemoTrips(undefined, {}, asha);
    expect(listed.map((trip) => trip.id)).toEqual([mine.id]);
    await expect(Query.meetingBotDemoTrip(undefined, { id: theirs.id }, asha)).rejects.toThrow(
      'not found',
    );
    await expect(Query.meetingBotDemoTrip(undefined, { id: 'nope' }, asha)).rejects.toThrow(
      'not found',
    );
    expect((await Query.meetingBotDemoTrip(undefined, { id: mine.id }, asha)).id).toBe(mine.id);
  });

  it('shows the notes once written: summary, decisions and open actions', async () => {
    const trip = await send$(asha);
    await recordMeeting(trip.id);
    const seen = await Query.meetingBotDemoTrip(undefined, { id: trip.id }, asha);
    expect(seen.status).toBe('DONE');
    expect(seen.summaryStatus).toBe('READY');
    expect(seen.summary).toMatchObject({
      title: 'Demo call · Acme',
      executiveSummary: 'Overview only',
      discussionPoints: ['Pricing'],
      decisions: ['Go with plan B'],
      actionItems: [
        { title: 'Send quote', assignedTo: 'Asha', dueText: 'Friday', dueDate: null },
        {
          title: 'Book demo',
          assignedTo: null,
          dueText: null,
          dueDate: new Date('2026-11-06T00:00:00Z'),
        },
      ],
    });
  });

  it('shows the notes’ progress before they are written, and nothing once the meeting is gone', async () => {
    const trip = await send$(asha);
    const meetingId = await recordMeeting(trip.id, false);
    const pending = await Query.meetingBotDemoTrip(undefined, { id: trip.id }, asha);
    expect(pending).toMatchObject({ summaryStatus: 'RUNNING', summary: null });
    await inDemo(() => MaMeetingModel.deleteOne({ _id: meetingId }));
    const gone = await Query.meetingBotDemoTrip(undefined, { id: trip.id }, asha);
    expect(gone).toMatchObject({ summaryStatus: 'NOT_STARTED', summary: null });
  });

  it('reads as failed when the bot trip itself has gone', async () => {
    const trip = await send$(asha);
    await inDemo(() => MaBotDispatchModel.deleteMany({}));
    const seen = await Query.meetingBotDemoTrip(undefined, { id: trip.id }, asha);
    expect(seen).toMatchObject({ status: 'FAILED', error: '', meetUrl: MEET, finishedAt: null });
  });

  it('calls the bot back from the visitor’s own call only', async () => {
    const trip = await send$(asha);
    await expect(Mutation.cancelMeetingBotDemo(undefined, { id: trip.id }, ravi)).rejects.toThrow(
      'not found',
    );
    const cancelled = await Mutation.cancelMeetingBotDemo(undefined, { id: trip.id }, asha);
    expect(cancelled.status).toBe('CANCELLED');
    const again = await Mutation.cancelMeetingBotDemo(undefined, { id: trip.id }, asha);
    expect(again.status).toBe('CANCELLED');
  });
});

describe('the demo sweep', () => {
  it('emails the notes once they are written, exactly once, with the demo page link', async () => {
    const trip = await send$(asha);
    await runMeetingBotDemoSweep();
    expect(send).not.toHaveBeenCalled();
    await recordMeeting(trip.id);
    await runMeetingBotDemoSweep();
    await runMeetingBotDemoSweep();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({
      template: 'meeting-assistant-summary',
      to: 'asha@example.com',
      variables: expect.objectContaining({ meetingUrl: env.demos.meetingBot.pageUrl }),
    });
    const seen = await Query.meetingBotDemoTrip(undefined, { id: trip.id }, asha);
    expect(seen.emailedAt).toBeInstanceOf(Date);
  });

  it('records a failed send on the trip instead of sending it twice', async () => {
    const trip = await send$(asha);
    await recordMeeting(trip.id);
    send.mockRejectedValueOnce(new Error('SMTP down'));
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    await runMeetingBotDemoSweep();
    await runMeetingBotDemoSweep();
    expect(send).toHaveBeenCalledTimes(1);
    const row = await inDemo(() => MeetingBotDemoTripModel.findById(trip.id).lean());
    expect(row?.emailError).toBe('SMTP down');
    expect(warn).toHaveBeenCalled();
  });

  it('records a failure that is not an Error in plain words', async () => {
    const trip = await send$(asha);
    await recordMeeting(trip.id);
    send.mockRejectedValueOnce('boom');
    jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    await runMeetingBotDemoSweep();
    const row = await inDemo(() => MeetingBotDemoTripModel.findById(trip.id).lean());
    expect(row?.emailError).toBe('Send failed');
  });

  it('leaves a trip another pass already claimed to that pass', async () => {
    const trip = await send$(asha);
    await recordMeeting(trip.id);
    jest.spyOn(MeetingBotDemoTripModel, 'findOneAndUpdate').mockResolvedValueOnce(null);
    await runMeetingBotDemoSweep();
    expect(send).not.toHaveBeenCalled();
  });

  it('stops waiting for notes after two days', async () => {
    const trip = await send$(asha);
    await recordMeeting(trip.id);
    await runMeetingBotDemoSweep(new Date(Date.now() + 3 * DAY_MS));
    expect(send).not.toHaveBeenCalled();
  });

  it('deletes the recorded meeting when its retention is over, and only then', async () => {
    const trip = await send$(asha);
    const meetingId = await recordMeeting(trip.id);
    const queued = await send$(ravi, 'https://meet.google.com/xyz-abcd-efg');
    const info = jest.spyOn(logger, 'info').mockImplementation(() => logger);
    await runMeetingBotDemoSweep();
    expect(await inDemo(() => MaMeetingModel.exists({ _id: meetingId }))).toBeTruthy();
    const later = new Date(Date.now() + (env.demos.meetingBot.retentionDays + 1) * DAY_MS);
    await runMeetingBotDemoSweep(later);
    expect(await inDemo(() => MaMeetingModel.exists({ _id: meetingId }))).toBeNull();
    expect(await inDemo(() => MaNotesModel.countDocuments())).toBe(0);
    const seen = await Query.meetingBotDemoTrip(undefined, { id: trip.id }, asha);
    expect(seen).toMatchObject({ purged: true, summary: null });
    const never = await Query.meetingBotDemoTrip(undefined, { id: queued.id }, ravi);
    expect(never.purged).toBe(true);
    expect(info).toHaveBeenCalledWith('Meeting bot demo deleted 2 expired demo meeting(s)');
  });

  it('runs on a timer that logs a failed pass and never keeps the process alive', async () => {
    jest.useFakeTimers();
    const unref = jest.fn();
    const interval = jest
      .spyOn(globalThis, 'setInterval')
      .mockReturnValue({ unref } as unknown as NodeJS.Timeout);
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
    const error = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    jest.spyOn(OrganizationModel, 'findOne').mockImplementation(() => {
      throw new Error('db down');
    });
    startMeetingBotDemoSweep();
    expect(unref).toHaveBeenCalled();
    const tick = interval.mock.calls[0][0] as () => void;
    tick();
    jest.useRealTimers();
    await new Promise((resolve) => setImmediate(resolve));
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Meeting bot demo sweep failed',
    );
  });
});

describe('the schema', () => {
  it('describes every demo operation for the API reference', () => {
    const body = meetingBotDemoTypeDefs.loc?.source.body ?? '';
    for (const name of [
      'meetingBotDemoInfo',
      'meetingBotDemoTrips',
      'meetingBotDemoTrip',
      'sendMeetingBotDemo',
      'cancelMeetingBotDemo',
    ]) {
      expect(body).toMatch(new RegExp(`"[^"]+"\\s+${name}`));
    }
  });
});
