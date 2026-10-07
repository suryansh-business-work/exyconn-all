import {
  closeExpiredSessions,
  handOff,
  startChatHandoff,
  sweepHandoffs,
} from '../../../../src/modules/website-chat/chat.handoff';
import { answerQuestion } from '../../../../src/modules/website-chat/chat.bot';
import { closeSession } from '../../../../src/modules/website-chat/chat.session';
import {
  ChatMessageModel,
  ChatSessionModel,
  ChatSettingsModel,
} from '../../../../src/modules/website-chat/models';
import { findBackgroundJob } from '../../../../src/modules/tech/jobs.registry';
import { readJobRuns } from '../../../../src/utils/jobHeartbeat';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { logger } from '../../../../src/utils/logger';
import { createSession, until, useChatOperator } from './chat.fixtures';

jest.mock('../../../../src/modules/website-chat/chat.bot', () => ({ answerQuestion: jest.fn() }));
jest.mock('../../../../src/modules/website-chat/chat.session', () => ({ closeSession: jest.fn() }));

useChatOperator();

const answer = answerQuestion as jest.Mock;
const close = closeSession as jest.Mock;
const ago = (ms: number) => new Date(Date.now() - ms);

const visitorLine = (sessionId: string, body: string, createdAt: Date, channel = 'LIVE') => ({
  sessionId,
  channel,
  sender: 'VISITOR',
  body,
  createdAt,
});

beforeEach(() => {
  answer.mockResolvedValue(undefined);
  close.mockResolvedValue(undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('handOff', () => {
  it('tells the visitor why and has the bot answer every unanswered live question', async () => {
    const since = ago(5 * 60_000);
    const session = await createSession({ awaitingReplySince: since });
    const sessionId = String(session._id);
    await ChatMessageModel.insertMany([
      visitorLine(sessionId, 'Answered earlier', ago(10 * 60_000)),
      visitorLine(sessionId, 'What do you charge?', since),
      visitorLine(sessionId, 'Bot thread', ago(4 * 60_000), 'KNOWLEDGE'),
      visitorLine(sessionId, '', ago(3 * 60_000)),
      visitorLine(sessionId, 'Hello?', ago(2 * 60_000)),
    ]);

    await handOff(sessionId, 'The bot has it.');

    const saved = await ChatSessionModel.findById(sessionId).lean();
    expect(saved?.awaitingReplySince).toBeNull();
    expect(saved?.handedOffAt).toBeInstanceOf(Date);
    const notice = await ChatMessageModel.findOne({ sender: 'SYSTEM' }).lean();
    expect(notice).toMatchObject({ channel: 'LIVE', body: 'The bot has it.' });
    expect(answer).toHaveBeenCalledWith(sessionId, 'What do you charge?\nHello?', 'LIVE');
  });

  it('posts the notice without asking the bot when the questions carry no text', async () => {
    const since = ago(60_000);
    const session = await createSession({ awaitingReplySince: since });
    await ChatMessageModel.insertMany([visitorLine(String(session._id), '', since)]);
    await handOff(String(session._id), 'Notice');
    expect(await ChatMessageModel.countDocuments({ sender: 'SYSTEM' })).toBe(1);
    expect(answer).not.toHaveBeenCalled();
  });

  it('hands a question over once, and never from a closed chat', async () => {
    const answered = await createSession();
    const closed = await createSession({ status: 'CLOSED', awaitingReplySince: ago(60_000) });
    await handOff(String(answered._id), 'Notice');
    await handOff(String(closed._id), 'Notice');
    expect(await ChatMessageModel.countDocuments()).toBe(0);
    expect(answer).not.toHaveBeenCalled();
    expect((await ChatSessionModel.findById(closed._id).lean())?.handedOffAt).toBeNull();
  });
});

describe('closeExpiredSessions', () => {
  it('closes every open chat past its timeout', async () => {
    const expired = await createSession({ expiresAt: ago(1000) });
    await createSession({ expiresAt: new Date(Date.now() + 60_000) });
    await createSession({ status: 'CLOSED', expiresAt: ago(1000) });
    await createSession();

    await expect(closeExpiredSessions(10)).resolves.toBe(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledWith(
      String(expired._id),
      'Session timeout',
      'This chat ended after 10 minutes without a message. Start a new chat any time.',
    );
  });
});

describe('sweepHandoffs', () => {
  it('hands over chats waiting past the timeout, closes timed-out ones and records the run', async () => {
    await ChatSettingsModel.create({
      noReplyTimeoutSeconds: 60,
      sessionTimeoutMinutes: 5,
      handoffMessage: 'Over to the bot.',
    });
    const waiting = await createSession({ awaitingReplySince: ago(120_000) });
    await ChatMessageModel.insertMany([visitorLine(String(waiting._id), 'Prices?', ago(120_000))]);
    const fresh = await createSession({ awaitingReplySince: ago(10_000) });
    await createSession({ expiresAt: ago(1000) });

    await sweepHandoffs();

    expect(answer).toHaveBeenCalledWith(String(waiting._id), 'Prices?', 'LIVE');
    expect((await ChatSessionModel.findById(fresh._id).lean())?.awaitingReplySince).not.toBeNull();
    expect(await ChatMessageModel.findOne({ sender: 'SYSTEM' }).lean()).toMatchObject({
      body: 'Over to the bot.',
    });
    expect(close).toHaveBeenCalledWith(
      expect.any(String),
      'Session timeout',
      expect.stringContaining('5 minutes'),
    );
    expect(readJobRuns().get('websiteChatHandoff')?.summary).toBe(
      'Handed 1 website chats to the bot, closed 1 timed out',
    );
  });

  it('is registered as a background job that runs the same pass', () => {
    expect(findBackgroundJob('websiteChatHandoff')?.runOnce).toBe(sweepHandoffs);
  });
});

describe('startChatHandoff', () => {
  function start() {
    const unref = jest.fn();
    const interval = jest
      .spyOn(globalThis, 'setInterval')
      .mockImplementation((() => ({ unref })) as unknown as typeof setInterval);
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    startChatHandoff();
    const [tick, ms] = interval.mock.calls[0];
    interval.mockRestore();
    return { tick: tick as () => void, ms, unref };
  }

  it("runs a pass every fifteen seconds in the operator's company", async () => {
    const { tick, ms, unref } = start();
    expect(ms).toBe(15_000);
    expect(unref).toHaveBeenCalled();
    const waiting = await createSession({ awaitingReplySince: ago(10 * 60_000) });
    await ChatMessageModel.insertMany([visitorLine(String(waiting._id), 'Hi?', ago(10 * 60_000))]);

    tick();

    await until(() => answer.mock.calls.length > 0);
    expect(answer).toHaveBeenCalledWith(String(waiting._id), 'Hi?', 'LIVE');
  });

  it('logs a pass that fails', async () => {
    const { tick } = start();
    await runAsPlatform(() => OrganizationModel.deleteMany({}));
    invalidatePlatformOperatorCache();
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    tick();

    await until(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(expect.anything(), 'Website chat handoff pass failed');
  });
});
