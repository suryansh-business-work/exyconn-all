import { Types } from 'mongoose';
import {
  listMessages,
  markReadByStaff,
  markReadByVisitor,
  postMessage,
  rateAnswer,
} from '../../../../src/modules/website-chat/chat.messages';
import { chatHub } from '../../../../src/modules/website-chat/chat.hub';
import { ChatMessageModel, ChatSessionModel } from '../../../../src/modules/website-chat/models';
import { createSession, fakePeer, framesOf } from './chat.fixtures';

const kinds = (socket: Parameters<typeof framesOf>[0]) => framesOf(socket).map((f) => f.t);

async function setup() {
  const session = await createSession();
  const sessionId = String(session._id);
  const visitor = fakePeer({ role: 'visitor', sessionId });
  const staff = fakePeer({ role: 'staff', watching: sessionId });
  chatHub.join(visitor.peer);
  chatHub.join(staff.peer);
  return { sessionId, visitor, staff };
}

const visitorLine = (sessionId: string, body = 'Hello?') =>
  ({ sessionId, channel: 'LIVE', sender: 'VISITOR', senderName: 'Dana', body }) as const;

afterEach(() => {
  for (const peer of chatHub.all()) {
    chatHub.leave(peer);
  }
});

describe('postMessage', () => {
  it("starts the reply clock on a visitor's live message and delivers it everywhere", async () => {
    const { sessionId, visitor, staff } = await setup();
    const created = await postMessage(visitorLine(sessionId), 'client-1');
    const session = await ChatSessionModel.findById(sessionId).lean();
    expect(session).toMatchObject({
      staffUnread: 1,
      messageCount: 1,
      lastSender: 'VISITOR',
      lastMessagePreview: 'Hello?',
    });
    expect(session?.awaitingReplySince).toEqual(created.createdAt);
    expect(session?.expiresAt?.getTime()).toBe(created.createdAt.getTime() + 10 * 60_000);
    expect(kinds(visitor.socket)).toEqual(['message', 'session']);
    expect(kinds(staff.socket)).toEqual(['message', 'session']);
    expect(framesOf(visitor.socket)[0]).toMatchObject({
      clientId: 'client-1',
      message: { body: 'Hello?', sender: 'VISITOR', attachments: [], feedback: null },
    });
  });

  it('keeps the first unanswered time and stops the clock when an agent replies', async () => {
    const { sessionId } = await setup();
    const first = await postMessage(visitorLine(sessionId));
    await postMessage(visitorLine(sessionId, 'Anyone?'));
    let session = await ChatSessionModel.findById(sessionId).lean();
    expect(session?.awaitingReplySince).toEqual(first.createdAt);
    expect(session?.staffUnread).toBe(2);

    await postMessage({ ...visitorLine(sessionId, 'Hi Dana'), sender: 'AGENT', senderId: 'u1' });
    session = await ChatSessionModel.findById(sessionId).lean();
    expect(session?.awaitingReplySince).toBeNull();
    expect(session?.staffUnread).toBe(2);
    expect(await ChatMessageModel.findOne({ sender: 'AGENT' }).lean()).toMatchObject({
      senderId: 'u1',
    });
  });

  it('does not count bot questions as unread nor let a notice extend the chat', async () => {
    const { sessionId } = await setup();
    await postMessage({ ...visitorLine(sessionId), channel: 'KNOWLEDGE' });
    const before = await ChatSessionModel.findById(sessionId).lean();
    expect(before).toMatchObject({ staffUnread: 0, awaitingReplySince: null });

    await postMessage({ ...visitorLine(sessionId, 'Welcome'), sender: 'SYSTEM', senderName: '' });
    const after = await ChatSessionModel.findById(sessionId).lean();
    expect(after?.expiresAt).toEqual(before?.expiresAt);
    expect(after).toMatchObject({ lastSender: 'SYSTEM', messageCount: 2 });
  });

  it('previews an attachment by its kind and trims a long body', async () => {
    const { sessionId } = await setup();
    const voice = {
      url: 'https://ik.test/v.webm',
      name: 'v.webm',
      kind: 'AUDIO',
      size: 9,
    } as const;
    await postMessage({ ...visitorLine(sessionId, ''), attachments: [voice] });
    expect((await ChatSessionModel.findById(sessionId).lean())?.lastMessagePreview).toBe(
      'Voice note',
    );
    await postMessage(visitorLine(sessionId, 'y'.repeat(200)));
    expect((await ChatSessionModel.findById(sessionId).lean())?.lastMessagePreview).toBe(
      'y'.repeat(140),
    );
    await postMessage({ ...visitorLine(sessionId, ''), sender: 'SYSTEM' });
    expect((await ChatSessionModel.findById(sessionId).lean())?.lastMessagePreview).toBe('');
  });

  it('stores a bot answer with its sources and suggestions', async () => {
    const { sessionId } = await setup();
    const created = await postMessage({
      sessionId,
      channel: 'KNOWLEDGE',
      sender: 'BOT',
      senderName: 'Exy',
      body: 'Plans start at $10.',
      sources: [{ title: 'Pricing', url: 'https://exyconn.com/pricing' }],
      suggestions: ['Support?'],
    });
    expect(created.suggestions).toEqual(['Support?']);
    expect(created.sources[0]).toMatchObject({ title: 'Pricing' });
  });

  it('still delivers a message whose session is gone, without a session update', async () => {
    const sessionId = String(new Types.ObjectId());
    const staff = fakePeer({ role: 'staff' });
    chatHub.join(staff.peer);
    await postMessage(visitorLine(sessionId));
    expect(kinds(staff.socket)).toEqual(['message']);
  });
});

describe('listMessages', () => {
  it('lists one session oldest first', async () => {
    const { sessionId } = await setup();
    await postMessage(visitorLine(sessionId, 'one'));
    await postMessage(visitorLine(sessionId, 'two'));
    await postMessage(visitorLine(String(new Types.ObjectId()), 'elsewhere'));
    expect((await listMessages(sessionId)).map((m) => m.body)).toEqual(['one', 'two']);
  });
});

describe('read receipts and ratings', () => {
  it("marks the visitor's messages read by the team and clears the unread count", async () => {
    const { sessionId, visitor, staff } = await setup();
    await postMessage(visitorLine(sessionId));
    visitor.socket.send.mockClear();
    staff.socket.send.mockClear();

    await markReadByStaff(sessionId);
    expect(await ChatMessageModel.countDocuments({ readAt: null })).toBe(0);
    expect((await ChatSessionModel.findById(sessionId).lean())?.staffUnread).toBe(0);
    expect(kinds(visitor.socket)).toEqual(['session', 'read']);
    expect(framesOf(visitor.socket)[1]).toMatchObject({ by: 'AGENT' });
    expect(kinds(staff.socket)).toEqual(['session']);
  });

  it('tells the visitor about a read even when the session is gone', async () => {
    const sessionId = String(new Types.ObjectId());
    const visitor = fakePeer({ role: 'visitor', sessionId });
    chatHub.join(visitor.peer);
    await markReadByStaff(sessionId);
    expect(kinds(visitor.socket)).toEqual(['read']);
  });

  it('marks replies read by the visitor and tells the consoles watching', async () => {
    const { sessionId, staff } = await setup();
    await postMessage(visitorLine(sessionId));
    await postMessage({ ...visitorLine(sessionId, 'Hi'), sender: 'AGENT' });
    staff.socket.send.mockClear();

    await markReadByVisitor(sessionId);
    expect(await ChatMessageModel.countDocuments({ sender: 'AGENT', readAt: null })).toBe(0);
    expect(await ChatMessageModel.countDocuments({ sender: 'VISITOR', readAt: null })).toBe(1);
    expect(framesOf(staff.socket)).toEqual([
      expect.objectContaining({ t: 'read', sessionId, by: 'VISITOR' }),
    ]);
  });

  it("records a thumbs up or down on the bot's answers only", async () => {
    const { sessionId, visitor } = await setup();
    const bot = await postMessage({ ...visitorLine(sessionId, 'Answer'), sender: 'BOT' });
    const own = await postMessage(visitorLine(sessionId, 'Question'));
    visitor.socket.send.mockClear();

    await rateAnswer(sessionId, String(bot._id), true);
    expect((await ChatMessageModel.findById(bot._id).lean())?.feedback).toBe('UP');
    expect(framesOf(visitor.socket)).toEqual([
      expect.objectContaining({
        t: 'messageUpdated',
        message: expect.objectContaining({ feedback: 'UP' }),
      }),
    ]);

    await rateAnswer(sessionId, String(bot._id), false);
    expect((await ChatMessageModel.findById(bot._id).lean())?.feedback).toBe('DOWN');

    visitor.socket.send.mockClear();
    await rateAnswer(sessionId, String(own._id), true);
    expect((await ChatMessageModel.findById(own._id).lean())?.feedback).toBe('');
    expect(visitor.socket.send).not.toHaveBeenCalled();
  });
});
