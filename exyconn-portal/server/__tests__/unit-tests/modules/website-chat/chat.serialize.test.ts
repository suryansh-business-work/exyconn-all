import {
  toMessage,
  toStaffSession,
  toVisitorSession,
} from '../../../../src/modules/website-chat/chat.serialize';
import { ChatMessageModel, ChatSessionModel } from '../../../../src/modules/website-chat/models';

type MessageDoc = Parameters<typeof toMessage>[0];
type SessionDoc = Parameters<typeof toStaffSession>[0];

const at = new Date('2026-10-05T10:00:00Z');

/** A message as Mongoose builds it, with its defaults, plus what the caller sets. */
function messageDoc(fields: Record<string, unknown>): MessageDoc {
  const doc = new ChatMessageModel({
    sessionId: 's1',
    channel: 'KNOWLEDGE',
    sender: 'BOT',
    ...fields,
  });
  return { ...doc.toObject(), createdAt: at, updatedAt: at } as MessageDoc;
}

function sessionDoc(fields: Record<string, unknown> = {}): SessionDoc {
  const doc = new ChatSessionModel({
    name: 'Dana',
    email: 'dana@acme.test',
    site: 'TOOLS',
    ...fields,
  });
  return { ...doc.toObject(), createdAt: at, updatedAt: at } as SessionDoc;
}

describe('toMessage', () => {
  it('copies the fields both sides read and reads an unrated message as null feedback', () => {
    const doc = messageDoc({
      body: 'Plans start at $10.',
      senderName: 'Exy',
      attachments: [{ url: 'https://ik.test/a.png', name: 'a.png', kind: 'IMAGE', size: 12 }],
      sources: [{ title: 'Pricing', url: 'https://exyconn.com/pricing' }],
      suggestions: ['What about support?'],
    });
    expect(toMessage(doc)).toEqual({
      id: String(doc._id),
      sessionId: 's1',
      channel: 'KNOWLEDGE',
      sender: 'BOT',
      senderName: 'Exy',
      body: 'Plans start at $10.',
      attachments: [{ url: 'https://ik.test/a.png', name: 'a.png', kind: 'IMAGE', size: 12 }],
      sources: [{ title: 'Pricing', url: 'https://exyconn.com/pricing' }],
      suggestions: ['What about support?'],
      feedback: null,
      createdAt: at,
      readAt: null,
    });
  });

  it('keeps a rating and a read time, and reads missing lists as empty', () => {
    const readAt = new Date('2026-10-05T10:05:00Z');
    const doc = {
      ...messageDoc({ feedback: 'UP', readAt }),
      sources: undefined,
      suggestions: undefined,
    };
    const message = toMessage(doc as unknown as MessageDoc);
    expect(message.feedback).toBe('UP');
    expect(message.readAt).toEqual(readAt);
    expect(message.sources).toEqual([]);
    expect(message.suggestions).toEqual([]);
  });
});

describe('toVisitorSession', () => {
  it('tells the widget its session and who on the team has it', () => {
    const doc = sessionDoc({ assigneeName: 'Sam', ticketReference: 'TCK-9', phone: '+15550100' });
    expect(toVisitorSession(doc)).toEqual({
      id: String(doc._id),
      name: 'Dana',
      email: 'dana@acme.test',
      phone: '+15550100',
      status: 'OPEN',
      ticketReference: 'TCK-9',
      agentName: 'Sam',
      expiresAt: null,
      createdAt: at,
      closedAt: null,
    });
  });

  it('reads missing dates as null and keeps set ones', () => {
    const closedAt = new Date('2026-10-05T11:00:00Z');
    const doc = { ...sessionDoc({ closedAt, expiresAt: closedAt }) };
    expect(toVisitorSession(doc).closedAt).toEqual(closedAt);
    const bare = { ...sessionDoc(), expiresAt: undefined, closedAt: undefined };
    expect(toVisitorSession(bare as unknown as SessionDoc).expiresAt).toBeNull();
  });
});

describe('toStaffSession', () => {
  it('lists everything but the token version and says whether Slack follows it', () => {
    const doc = sessionDoc({ slackThreadTs: '171.5', tokenVersion: 3, staffUnread: 2 });
    const staff = toStaffSession(doc);
    expect(staff).not.toHaveProperty('tokenVersion');
    expect(staff).toMatchObject({
      id: String(doc._id),
      site: 'TOOLS',
      staffUnread: 2,
      lastSender: '',
      lastMessageAt: null,
      awaitingReplySince: null,
      handedOffAt: null,
      assignedAt: null,
      slackLinked: true,
      createdAt: at,
      updatedAt: at,
    });
    expect(toStaffSession(sessionDoc()).slackLinked).toBe(false);
  });

  it('reads missing optional fields as null or empty', () => {
    const bare = {
      ...sessionDoc(),
      lastMessageAt: undefined,
      lastSender: undefined,
      awaitingReplySince: undefined,
      handedOffAt: undefined,
      closedAt: undefined,
      assignedAt: undefined,
      expiresAt: undefined,
    };
    const staff = toStaffSession(bare as unknown as SessionDoc);
    expect(staff.lastSender).toBe('');
    expect(staff.lastMessageAt).toBeNull();
    expect(staff.expiresAt).toBeNull();
    const when = new Date('2026-10-05T12:00:00Z');
    const dates = {
      lastMessageAt: when,
      awaitingReplySince: when,
      handedOffAt: when,
      closedAt: when,
      assignedAt: when,
      expiresAt: when,
    };
    expect(toStaffSession(sessionDoc({ ...dates, lastSender: 'AGENT' }))).toMatchObject({
      ...dates,
      lastSender: 'AGENT',
    });
  });
});
