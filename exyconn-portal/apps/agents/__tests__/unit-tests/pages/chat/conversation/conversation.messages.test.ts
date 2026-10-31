import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  WebsiteChatAttachmentKind,
  WebsiteChatChannel,
  WebsiteChatSender,
} from '@exyconn/shell/graphql/generated';
import {
  mergeMessages,
  newerSession,
  optimisticMessage,
  toCachedMessage,
  withVisitorRead,
} from '../../../../../src/pages/chat/conversation/conversation.messages';
import { chatMessage, chatSession } from '../chat-fixtures';

const at = (minute: number) => `2026-10-01T10:${String(minute).padStart(2, '0')}:00.000Z`;

describe('mergeMessages', () => {
  it('shows each message once, oldest first, preferring the live copy', () => {
    const first = chatMessage({ id: 'a', createdAt: at(1) });
    const second = chatMessage({ id: 'b', createdAt: at(2), body: 'old' });
    const third = chatMessage({ id: 'c', createdAt: at(3) });
    const liveSecond = { ...second, body: 'edited' };

    expect(mergeMessages([third, second], [liveSecond, first])).toEqual([first, liveSecond, third]);
  });

  it('is empty with nothing on either side', () => {
    expect(mergeMessages([], [])).toEqual([]);
  });
});

describe('toCachedMessage', () => {
  it('adds the type names the Apollo cache keeps', () => {
    const message = chatMessage({
      attachments: [
        { url: 'https://cdn/x.png', name: 'x.png', kind: WebsiteChatAttachmentKind.Image, size: 4 },
      ],
      sources: [{ title: 'Pricing', url: 'https://exyconn.com/pricing' }],
    });
    const cached = toCachedMessage(message);

    expect(cached.__typename).toBe('WebsiteChatMessage');
    expect(cached.attachments[0]).toEqual({
      ...message.attachments[0],
      __typename: 'WebsiteChatAttachment',
    });
    expect(cached.sources[0]).toEqual({ ...message.sources[0], __typename: 'WebsiteChatSource' });
    expect(cached.body).toBe(message.body);
  });
});

describe('withVisitorRead', () => {
  const visitor = chatMessage({ id: 'v' });
  const agent = chatMessage({ id: 'a', sender: WebsiteChatSender.Agent });
  const bot = chatMessage({ id: 'b', sender: WebsiteChatSender.Bot });
  const seenEarlier = chatMessage({ id: 's', sender: WebsiteChatSender.Agent, readAt: at(1) });

  it('leaves the thread alone until the visitor has read it', () => {
    const messages = [visitor, agent];
    expect(withVisitorRead(messages, null)).toBe(messages);
  });

  it('marks every unread reply as seen, keeping earlier read times and visitor messages', () => {
    const read = withVisitorRead([visitor, agent, bot, seenEarlier], at(9));

    expect(read.map((message) => message.readAt)).toEqual([null, at(9), at(9), at(1)]);
  });
});

describe('newerSession', () => {
  const older = chatSession({ updatedAt: at(1), name: 'Query copy' });
  const newer = chatSession({ updatedAt: at(2), name: 'Socket copy' });

  it('uses whichever copy exists when only one does', () => {
    expect(newerSession(older, null)).toBe(older);
    expect(newerSession(undefined, newer)).toBe(newer);
    expect(newerSession(undefined, null)).toBeUndefined();
  });

  it('prefers the socket copy only when it is more recent', () => {
    expect(newerSession(older, newer)).toBe(newer);
    expect(newerSession(newer, older)).toBe(newer);
    expect(newerSession(older, { ...older, name: 'Same time' })).toBe(older);
  });
});

describe('optimisticMessage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the agent reply in the live thread straight away, sized from base64', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(at(5)));
    const message = optimisticMessage({
      clientId: 'client-1',
      sessionId: 's1',
      senderName: 'Ravi',
      body: 'On it',
      files: [
        { name: 'clip.mp4', data: 'data:video/mp4;base64,AAAA' },
        { name: 'note.webm', data: 'data:audio/webm;base64,AAAA' },
        { name: 'photo.png', data: 'data:image/png;base64,AAAA' },
      ],
    });

    expect(message).toMatchObject({
      id: 'client-1',
      sessionId: 's1',
      channel: WebsiteChatChannel.Live,
      sender: WebsiteChatSender.Agent,
      senderName: 'Ravi',
      body: 'On it',
      sources: [],
      suggestions: [],
      feedback: null,
      readAt: null,
      createdAt: at(5),
    });
    expect(message.attachments.map((file) => file.kind)).toEqual([
      WebsiteChatAttachmentKind.Video,
      WebsiteChatAttachmentKind.Audio,
      WebsiteChatAttachmentKind.Image,
    ]);
    expect(message.attachments[0]).toEqual({
      url: 'data:video/mp4;base64,AAAA',
      name: 'clip.mp4',
      kind: WebsiteChatAttachmentKind.Video,
      size: 20,
    });
  });
});
