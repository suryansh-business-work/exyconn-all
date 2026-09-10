import type { ParsedMail } from 'mailparser';
import { inboundMailbox, toInboundMessage } from '../../src/utils/inboundMail';
import { simpleParser } from 'mailparser';

/** The one IMAP client every `new ImapFlow(...)` in the reader hands back. */
const mockClient = {
  connect: jest.fn(),
  getMailboxLock: jest.fn(),
  logout: jest.fn(),
  fetch: jest.fn(),
  messageFlagsAdd: jest.fn(),
  messageDelete: jest.fn(),
};

jest.mock('imapflow', () => ({
  ImapFlow: jest.fn(() => mockClient),
}));

jest.mock('mailparser', () => ({
  simpleParser: jest.fn(),
}));

const parse = simpleParser as unknown as jest.Mock;

/** Credentials are a fixture here — nothing in this suite opens a socket. */
const config = {
  host: 'imap.test',
  port: 993,
  secure: true,
  user: 'help@exyconn.com',
  password: process.env.TEST_USER_PASSWORD ?? 'a-strong-password',
  mailbox: 'INBOX',
  deleteAfterImport: false,
};

/** What `client.fetch` returns: an async stream of raw messages. */
const streamOf = (messages: Array<{ uid: number; source: Buffer }>) => ({
  async *[Symbol.asyncIterator]() {
    yield* messages;
  },
});

const release = jest.fn();

beforeEach(() => {
  mockClient.connect.mockResolvedValue(undefined);
  mockClient.getMailboxLock.mockResolvedValue({ release });
  mockClient.logout.mockResolvedValue(undefined);
  mockClient.messageFlagsAdd.mockResolvedValue(true);
  mockClient.messageDelete.mockResolvedValue(true);
  mockClient.fetch.mockReturnValue(
    streamOf([
      { uid: 11, source: Buffer.from('first') },
      { uid: 12, source: Buffer.from('second') },
    ]),
  );
  parse.mockImplementation((source: Buffer) => ({
    from: { value: [{ address: `${source.toString()}@acme.test`, name: 'Dana' }] },
    subject: source.toString(),
    text: 'Body',
    headers: new Map(),
    attachments: [],
  }));
});

describe('Reading the support mailbox', () => {
  it('marks every imported message seen and leaves it in the mailbox', async () => {
    const result = await inboundMailbox.importAll(config, async () => undefined);

    expect(result).toEqual({ imported: 2, failed: 0 });
    expect(mockClient.messageFlagsAdd).toHaveBeenCalledWith('11', ['\\Seen'], { uid: true });
    expect(mockClient.messageFlagsAdd).toHaveBeenCalledWith('12', ['\\Seen'], { uid: true });
    expect(mockClient.messageDelete).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
    expect(mockClient.logout).toHaveBeenCalled();
  });

  it('leaves a message that failed to import unseen, and carries on with the next', async () => {
    const handle = jest
      .fn()
      .mockRejectedValueOnce(new Error('ImageKit is down'))
      .mockResolvedValueOnce(undefined);

    const result = await inboundMailbox.importAll(config, handle);

    expect(result).toEqual({ imported: 1, failed: 1 });
    expect(mockClient.messageFlagsAdd).toHaveBeenCalledTimes(1);
    expect(mockClient.messageFlagsAdd).toHaveBeenCalledWith('12', ['\\Seen'], { uid: true });
  });

  it('deletes an imported message only when the config asks for it', async () => {
    await inboundMailbox.importAll({ ...config, deleteAfterImport: true }, async () => undefined);

    expect(mockClient.messageDelete).toHaveBeenCalledWith('11', { uid: true });
    expect(mockClient.messageDelete).toHaveBeenCalledWith('12', { uid: true });
  });

  it('releases the mailbox and signs out even when the mailbox cannot be read', async () => {
    mockClient.fetch.mockImplementation(() => {
      throw new Error('connection reset');
    });

    await expect(inboundMailbox.importAll(config, async () => undefined)).rejects.toThrow(
      'connection reset',
    );
    expect(release).toHaveBeenCalled();
    expect(mockClient.logout).toHaveBeenCalled();
  });

  it('opens and closes the mailbox when credentials are being checked', async () => {
    await inboundMailbox.verify(config);

    expect(mockClient.getMailboxLock).toHaveBeenCalledWith('INBOX');
    expect(mockClient.logout).toHaveBeenCalled();
  });
});

/** Builds the parts of a parsed message the reducer reads, and nothing else. */
const parsed = (overrides: Partial<ParsedMail>): ParsedMail =>
  ({
    from: { value: [{ address: 'Dana@Acme.test', name: 'Dana Reyes' }] },
    subject: 'Portal will not load',
    headers: new Map(),
    attachments: [],
    ...overrides,
  }) as unknown as ParsedMail;

describe('Reducing a parsed message', () => {
  it('lower-cases the sender and keeps the threading headers', () => {
    const message = toInboundMessage(
      parsed({
        text: 'Every page hangs.',
        inReplyTo: '<abc@exyconn.com>',
        references: ['<one@exyconn.com>', '<two@exyconn.com>'],
      }),
    );

    expect(message).toMatchObject({
      from: 'dana@acme.test',
      fromName: 'Dana Reyes',
      body: 'Every page hangs.',
      inReplyTo: '<abc@exyconn.com>',
      references: '<one@exyconn.com> <two@exyconn.com>',
    });
  });

  it('reads a body out of the markup when there is no plain-text part', () => {
    const message = toInboundMessage(
      parsed({ html: '<p>Hello &amp; welcome</p><p>Second line</p>' }),
    );

    expect(message.body).toBe('Hello & welcome\nSecond line');
  });

  it('carries the automation headers through for the importer to judge', () => {
    const message = toInboundMessage(
      parsed({
        text: 'I am away',
        headers: new Map<string, unknown>([
          ['auto-submitted', 'Auto-Replied'],
          ['x-autoreply', 'yes'],
        ]) as ParsedMail['headers'],
      }),
    );

    expect(message).toMatchObject({ autoSubmitted: 'auto-replied', autoReply: true });
  });

  it('keeps real attachments and drops the images pasted into a signature', () => {
    const message = toInboundMessage(
      parsed({
        text: 'See attached',
        attachments: [
          {
            filename: 'invoice.pdf',
            contentType: 'application/pdf',
            content: Buffer.from('pdf'),
          },
          {
            filename: 'logo.png',
            contentType: 'image/png',
            contentDisposition: 'inline',
            content: Buffer.from('png'),
          },
        ] as unknown as ParsedMail['attachments'],
      }),
    );

    expect(message.attachments).toEqual([
      { filename: 'invoice.pdf', contentType: 'application/pdf', content: Buffer.from('pdf') },
    ]);
  });
});
