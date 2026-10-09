import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  WebsiteChatAttachmentKind,
  WebsiteChatChannel,
  WebsiteChatSender,
  WebsiteChatSite,
} from '@exyconn/shell/graphql/generated';
import { interpolate } from '@exyconn/i18n';
import {
  THREAD_TITLES,
  downloadText,
  transcriptText,
} from '../../../../../src/pages/chat/conversation/transcript';
import { chatMessage, chatSession } from '../chat-fixtures';

const formatDateTime = (value: string) => value.slice(11, 16);
/** Writes what the viewer would read, marking each translated string. */
const t = (source: string, values?: Record<string, string | number>) =>
  `«${interpolate(source, values)}»`;

describe('THREAD_TITLES', () => {
  it('lists the live thread first, then the knowledge bot', () => {
    expect(THREAD_TITLES).toEqual([
      { channel: WebsiteChatChannel.Live, title: 'Chat with us' },
      { channel: WebsiteChatChannel.Knowledge, title: 'Knowledge Bot' },
    ]);
  });
});

describe('transcriptText', () => {
  it('writes the visitor details, then both threads, in the viewer’s time format', () => {
    const session = chatSession({
      assigneeName: 'Ravi',
      site: WebsiteChatSite.Tools,
      phone: '',
    });
    const messages = [
      chatMessage({ id: 'a', body: 'Do you build bots?' }),
      chatMessage({
        id: 'b',
        sender: WebsiteChatSender.Agent,
        senderName: 'Ravi',
        body: '',
        createdAt: '2026-10-01T10:02:00.000Z',
        attachments: [
          {
            url: 'https://cdn.exyconn.com/deck.png',
            name: 'deck.png',
            kind: WebsiteChatAttachmentKind.Image,
            size: 10,
          },
        ],
      }),
      chatMessage({
        id: 'c',
        channel: WebsiteChatChannel.Knowledge,
        sender: WebsiteChatSender.Bot,
        senderName: 'Exy',
        body: 'Yes.',
      }),
    ];

    expect(transcriptText(session, messages, formatDateTime, t)).toBe(
      [
        '«Visitor»: Asha Rao',
        '«Email»: asha@example.com',
        '«Site»: «Tools site»',
        '«Page»: https://exyconn.com/pricing',
        '«Ticket»: TCK-12',
        '«Assignee»: Ravi',
        '«Started»: 09:59',
        '',
        '=== «Chat with us» ===',
        '[10:00] Asha: Do you build bots?',
        '[10:02] Ravi:',
        '    deck.png — https://cdn.exyconn.com/deck.png',
        '',
        '=== «Knowledge Bot» ===',
        '[10:00] Exy: Yes.',
        '',
      ].join('\n'),
    );
  });

  it('says when a thread has no messages', () => {
    const text = transcriptText(chatSession(), [], formatDateTime, t);

    expect(text).toContain('=== «Chat with us» ===\n«No messages»\n');
    expect(text.endsWith('=== «Knowledge Bot» ===\n«No messages»\n')).toBe(true);
    expect(text).not.toContain('«Assignee»');
  });
});

describe('downloadText', () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    vi.restoreAllMocks();
  });

  it('saves the text as a UTF-8 .txt file and releases the object URL', async () => {
    const blobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:transcript';
    });
    URL.revokeObjectURL = vi.fn();
    const clicked: Array<{ href: string; download: string }> = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download });
    });

    downloadText('chat-TCK-12.txt', 'Hello\n');

    expect(clicked).toEqual([{ href: 'blob:transcript', download: 'chat-TCK-12.txt' }]);
    expect(blobs[0].type).toBe('text/plain;charset=utf-8');
    await expect(blobs[0].text()).resolves.toBe('Hello\n');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:transcript');
  });
});
