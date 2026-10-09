import { Types } from 'mongoose';
import {
  closeSession,
  resumeSession,
  sessionForPass,
  startNewChat,
} from '../../../../src/modules/website-chat/chat.session';
import { signChatPass } from '../../../../src/modules/website-chat/chat.token';
import { emailTranscript } from '../../../../src/modules/website-chat/chat.transcript';
import { assignFreeAgent } from '../../../../src/modules/website-chat/chat.assign';
import { chatHub } from '../../../../src/modules/website-chat/chat.hub';
import {
  ChatMessageModel,
  ChatSessionModel,
  ChatSettingsModel,
} from '../../../../src/modules/website-chat/models';
import { emailer } from '../../../../src/modules/email/email.service';
import { fileClientTicket } from '../../../../src/modules/support/client-ticket.service';
import { logger } from '../../../../src/utils/logger';
import { codeOf } from '../codeOf';
import { createSession, fakePeer, framesOf, until } from './chat.fixtures';

jest.mock('../../../../src/modules/email/email.service', () => ({ emailer: { send: jest.fn() } }));
jest.mock('../../../../src/modules/support/client-ticket.service', () => ({
  fileClientTicket: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.assign', () => ({
  assignFreeAgent: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.transcript', () => ({
  emailTranscript: jest.fn(),
}));

const transcript = emailTranscript as jest.Mock;

const passFor = (session: { _id: unknown; tokenVersion: number }) =>
  signChatPass(String(session._id), session.tokenVersion);

beforeEach(() => {
  (emailer.send as jest.Mock).mockResolvedValue(undefined);
  (assignFreeAgent as jest.Mock).mockResolvedValue(undefined);
  (fileClientTicket as jest.Mock).mockResolvedValue({
    _id: new Types.ObjectId(),
    reference: 'TCK-2',
  });
  transcript.mockResolvedValue(undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
  for (const peer of chatHub.all()) {
    chatHub.leave(peer);
  }
});

describe('sessionForPass', () => {
  it('finds the session a live pass names', async () => {
    const session = await createSession();
    expect(String((await sessionForPass(passFor(session)))?._id)).toBe(String(session._id));
  });

  it('refuses a forged, retired or orphaned pass', async () => {
    const session = await createSession({ tokenVersion: 1 });
    expect(await sessionForPass('forged')).toBeNull();
    expect(await sessionForPass(signChatPass(String(session._id), 0))).toBeNull();
    expect(await sessionForPass(signChatPass(String(new Types.ObjectId()), 0))).toBeNull();
  });
});

describe('resumeSession', () => {
  it('reconnects to a closed chat with its conversation and a fresh pass', async () => {
    const session = await createSession({ status: 'CLOSED' });
    await ChatMessageModel.create({
      sessionId: String(session._id),
      channel: 'LIVE',
      sender: 'VISITOR',
      body: 'Hi',
    });
    const resumed = await resumeSession(passFor(session));
    expect(resumed?.session).toMatchObject({ id: String(session._id), status: 'CLOSED' });
    expect(resumed?.messages.map((m) => m.body)).toEqual(['Hi']);
    expect(typeof resumed?.token).toBe('string');
  });

  it('is null for a pass that no longer opens anything', async () => {
    await expect(resumeSession('forged')).resolves.toBeNull();
  });
});

describe('startNewChat', () => {
  it('opens another chat for the same visitor without a new code', async () => {
    const previous = await createSession({
      status: 'CLOSED',
      phone: '+1 555 0100',
      pageUrl: 'https://exyconn.com/pricing',
      site: 'TOOLS',
    });
    const next = await startNewChat(passFor(previous));
    expect(next.session.id).not.toBe(String(previous._id));
    expect(await ChatSessionModel.findById(next.session.id).lean()).toMatchObject({
      name: 'Dana Reyes',
      email: 'dana@acme.test',
      phone: '+1 555 0100',
      pageUrl: 'https://exyconn.com/pricing',
      site: 'TOOLS',
      status: 'OPEN',
    });
  });

  it('asks the visitor to sign in again when the pass is no good', async () => {
    await expect(startNewChat('forged')).rejects.toThrow('Sign in again to start a new chat.');
  });
});

describe('closeSession', () => {
  it('ends the chat, tells everyone and emails the transcript', async () => {
    const session = await createSession({ awaitingReplySince: new Date() });
    const sessionId = String(session._id);
    const visitor = fakePeer({ role: 'visitor', sessionId });
    chatHub.join(visitor.peer);

    const closed = await closeSession(sessionId, 'Sam');

    expect(closed).toMatchObject({ status: 'CLOSED', closedBy: 'Sam', awaitingReplySince: null });
    expect(closed.closedAt).toBeInstanceOf(Date);
    expect(await ChatMessageModel.findOne({ sender: 'SYSTEM' }).lean()).toMatchObject({
      body: 'Chat ended by Sam.',
    });
    const sessions = framesOf(visitor.socket).filter((frame) => frame.t === 'session');
    expect(sessions[sessions.length - 1]).toMatchObject({ session: { status: 'CLOSED' } });
    expect(transcript).toHaveBeenCalledWith(expect.objectContaining({ ticketReference: 'TCK-1' }));
  });

  it('uses the given notice and skips the transcript when the settings say so', async () => {
    await ChatSettingsModel.create({ transcriptOnClose: false });
    const session = await createSession();
    await closeSession(String(session._id), 'Session timeout', 'Timed out.');
    expect((await ChatMessageModel.findOne({ sender: 'SYSTEM' }).lean())?.body).toBe('Timed out.');
    expect(transcript).not.toHaveBeenCalled();
  });

  it('logs a transcript that fails', async () => {
    transcript.mockRejectedValueOnce(new Error('render failed'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const session = await createSession();
    await closeSession(String(session._id), 'Dana');
    await until(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Website chat transcript failed',
    );
  });

  it('leaves a chat that already ended as it was', async () => {
    const session = await createSession({ status: 'CLOSED', closedBy: 'Dana' });
    const result = await closeSession(String(session._id), 'Sam');
    expect(result.closedBy).toBe('Dana');
    expect(await ChatMessageModel.countDocuments()).toBe(0);
    expect(transcript).not.toHaveBeenCalled();
  });

  it('refuses a chat that does not exist', async () => {
    expect(await codeOf(closeSession(String(new Types.ObjectId()), 'Sam'))).toBe('NOT_FOUND');
  });
});
