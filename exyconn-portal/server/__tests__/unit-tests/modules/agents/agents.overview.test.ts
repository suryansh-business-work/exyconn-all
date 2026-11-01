import { Types } from 'mongoose';
import { addDays, subDays } from 'date-fns';
import {
  agentsOverview,
  DEFAULT_OVERVIEW_DAYS,
  overviewDays,
} from '../../../../src/modules/agents/agents.overview';
import { CallingBotCallModel } from '../../../../src/modules/calling-bot-demo/calling-bot.models';
import { ChatMessageModel } from '../../../../src/modules/website-chat/models';
import { stats } from '../../../../../../demos/whatsapp-demo/server/src/whatsappDemo.stats';
import { WhatsappDemoVisitorModel } from '../../../../../../demos/whatsapp-demo/server/src/visitor/visitor.model';
import { useTestOrganization } from '../../../helpers';
import { createSession } from '../website-chat/chat.fixtures';

/** The bot studio's own numbers are tested with its stats; here they are what each channel reports. */
jest.mock('../../../../../../demos/whatsapp-demo/server/src/whatsappDemo.stats', () => ({
  stats: jest.fn(),
}));

useTestOrganization();

const botStats = jest.mocked(stats);

const call = (status: string) =>
  CallingBotCallModel.create({
    channel: 'BROWSER',
    status,
    callerId: new Types.ObjectId().toHexString(),
    languageCode: 'en-IN',
  });

const visitor = (email: string) =>
  WhatsappDemoVisitorModel.create({ name: 'Asha', email, source: 'WEBSITE' });

const reply = (sessionId: string, sender: string) =>
  ChatMessageModel.create({ sessionId, channel: 'LIVE', sender, body: 'Hello' });

beforeEach(() => {
  botStats.mockImplementation(async (_from, _to, channel) =>
    channel === 'website'
      ? ({ sessions: 4, completionRate: 0.25 } as Awaited<ReturnType<typeof stats>>)
      : ({ sessions: 6, completionRate: 0.5 } as Awaited<ReturnType<typeof stats>>),
  );
});

describe('overviewDays', () => {
  it('uses 30 days when none, zero or a non-number is asked for', () => {
    expect(DEFAULT_OVERVIEW_DAYS).toBe(30);
    expect(overviewDays()).toBe(30);
    expect(overviewDays(null)).toBe(30);
    expect(overviewDays(0)).toBe(30);
    expect(overviewDays(Number.NaN)).toBe(30);
    expect(overviewDays(Number.POSITIVE_INFINITY)).toBe(30);
  });

  it('keeps a whole number of days from one to a year', () => {
    expect(overviewDays(7)).toBe(7);
    expect(overviewDays(7.9)).toBe(7);
    expect(overviewDays(-5)).toBe(1);
    expect(overviewDays(1000)).toBe(365);
  });
});

describe('agentsOverview', () => {
  it('counts what every agent recorded in the range', async () => {
    const answered = await createSession({ email: 'a@acme.test' });
    const botOnly = await createSession({ email: 'b@acme.test' });
    await reply(answered._id.toHexString(), 'AGENT');
    await reply(answered._id.toHexString(), 'AGENT');
    await reply(botOnly._id.toHexString(), 'BOT');
    await Promise.all([call('ENDED'), call('ENDED'), call('FAILED'), call('STARTING')]);
    await Promise.all([visitor('one@acme.test'), visitor('two@acme.test')]);
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const from = subDays(now, 29).toISOString().slice(0, 10);
    const overview = await agentsOverview(30, now);

    expect(overview).toEqual({
      days: 30,
      from,
      to: today,
      conversations: 6 + 4 + 2 + 4,
      whatsappSessions: 6,
      whatsappCompletionRate: 0.5,
      websiteAgentSessions: 4,
      websiteChats: 2,
      websiteChatsAnsweredByPeople: 1,
      deflectionRate: 0.5,
      calls: 4,
      callsCompleted: 2,
      callsFailed: 1,
      leadsCaptured: 2,
    });
    expect(botStats).toHaveBeenCalledWith(from, today, 'whatsapp');
    expect(botStats).toHaveBeenCalledWith(from, today, 'website');
  });

  it('leaves out what happened before the range, and reports no deflection without chats', async () => {
    const session = await createSession();
    await reply(session._id.toHexString(), 'AGENT');
    await call('ENDED');
    await visitor('old@acme.test');

    // A week from now, a one-day window starts after everything above was written.
    const overview = await agentsOverview(1, addDays(new Date(), 7));

    expect(overview).toMatchObject({
      days: 1,
      conversations: 10,
      websiteChats: 0,
      websiteChatsAnsweredByPeople: 0,
      deflectionRate: 0,
      calls: 0,
      callsCompleted: 0,
      callsFailed: 0,
      leadsCaptured: 0,
    });
    expect(overview.from).toBe(overview.to);
  });

  it('reads today when no moment is given', async () => {
    const overview = await agentsOverview(1);
    expect(overview.to).toBe(new Date().toISOString().slice(0, 10));
  });
});
