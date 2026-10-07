import type { ParsedMail } from 'mailparser';
import { simpleParser } from 'mailparser';
import { logger } from '../../../src/utils/logger';
import { inboundMailbox, toInboundMessage } from '../../../src/utils/inboundMail';

const mockClient = {
  connect: jest.fn(),
  getMailboxLock: jest.fn(),
  logout: jest.fn(),
  fetch: jest.fn(),
  messageFlagsAdd: jest.fn(),
  messageDelete: jest.fn(),
};

jest.mock('imapflow', () => ({ ImapFlow: jest.fn(() => mockClient) }));
jest.mock('mailparser', () => ({ simpleParser: jest.fn() }));

const parse = simpleParser as unknown as jest.Mock;
const release = jest.fn();

const config = {
  host: 'imap.acme.test',
  port: 993,
  secure: true,
  user: 'help@acme.test',
  password: `imap-${Date.now()}`,
  mailbox: 'Support',
  deleteAfterImport: false,
};

/** Only the parts of a parsed message the reducer reads. */
const parsed = (overrides: Record<string, unknown>): ParsedMail =>
  ({ headers: new Map(), attachments: [], ...overrides }) as unknown as ParsedMail;

describe('toInboundMessage', () => {
  it('answers empty fields for a message that carries almost nothing', () => {
    expect(toInboundMessage(parsed({}))).toEqual({
      from: '',
      fromName: '',
      subject: '',
      body: '',
      inReplyTo: '',
      references: '',
      autoSubmitted: '',
      autoReply: false,
      attachments: [],
    });
  });

  it('keeps a sender with no name, and a single references header as it is', () => {
    const message = toInboundMessage(
      parsed({
        from: { value: [{ address: 'Ops@Acme.Test' }] },
        references: '<one@acme.test>',
        text: 'plain',
      }),
    );
    expect(message).toMatchObject({
      from: 'ops@acme.test',
      fromName: '',
      references: '<one@acme.test>',
      body: 'plain',
    });
  });

  it('answers an empty address for a sender entry without one', () => {
    expect(toInboundMessage(parsed({ from: { value: [{ name: 'Nobody' }] } })).from).toBe('');
  });

  it('turns markup into text: drops scripts and styles, breaks lines, decodes entities', () => {
    const html =
      '<style>p{color:red}</style><script>alert(1)</script><div>One&nbsp;&lt;two&gt;</div>' +
      'Line<br/>&quot;quoted&quot; &#39;single&#39;<table><tr><td>cell</td></tr></table>';
    expect(toInboundMessage(parsed({ html })).body).toBe(
      'One <two>\nLine\n"quoted" \'single\'cell',
    );
  });

  it('prefers the plain-text part over the markup', () => {
    expect(toInboundMessage(parsed({ text: 'plain', html: '<p>markup</p>' })).body).toBe('plain');
  });

  it('ignores an Auto-Submitted header that is not text', () => {
    const headers = new Map<string, unknown>([['auto-submitted', { value: 'auto-generated' }]]);
    expect(toInboundMessage(parsed({ headers })).autoSubmitted).toBe('');
  });

  it('names an attachment that came without a file name or type', () => {
    const content = Buffer.from('bytes');
    const message = toInboundMessage(
      parsed({
        attachments: [
          { contentDisposition: 'inline', content: Buffer.from('logo') },
          { content },
          { filename: 'b.txt', contentType: 'text/plain', content },
        ],
      }),
    );
    expect(message.attachments).toEqual([
      { filename: 'attachment-1', contentType: '', content },
      { filename: 'b.txt', contentType: 'text/plain', content },
    ]);
  });
});

describe('inboundMailbox', () => {
  const streamOf = (messages: Array<{ uid: number; source?: Buffer }>) => ({
    async *[Symbol.asyncIterator]() {
      yield* messages;
    },
  });

  beforeEach(() => {
    mockClient.connect.mockResolvedValue(undefined);
    mockClient.getMailboxLock.mockResolvedValue({ release });
    mockClient.logout.mockResolvedValue(undefined);
    mockClient.messageFlagsAdd.mockResolvedValue(true);
    mockClient.messageDelete.mockResolvedValue(true);
    parse.mockImplementation(async (source: Buffer) => parsed({ text: source.toString() }));
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips a message the server would not hand over, leaving it for the next round', async () => {
    mockClient.fetch.mockReturnValue(
      streamOf([{ uid: 1 }, { uid: 2, source: Buffer.from('second') }]),
    );
    const bodies: string[] = [];
    const result = await inboundMailbox.importAll(config, async (message) => {
      bodies.push(message.body);
    });
    expect(result).toEqual({ imported: 1, failed: 0 });
    expect(bodies).toEqual(['second']);
    expect(mockClient.fetch).toHaveBeenCalledWith({ seen: false }, { uid: true, source: true });
    expect(mockClient.getMailboxLock).toHaveBeenCalledWith('Support');
  });

  it('counts a message that cannot be parsed as failed and logs it', async () => {
    mockClient.fetch.mockReturnValue(streamOf([{ uid: 5, source: Buffer.from('broken') }]));
    parse.mockRejectedValueOnce(new Error('bad MIME'));
    const result = await inboundMailbox.importAll(config, async () => undefined);
    expect(result).toEqual({ imported: 0, failed: 1 });
    expect(mockClient.messageFlagsAdd).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Inbound mail: message 5 could not be imported',
    );
  });

  it('answers nothing imported for an empty mailbox', async () => {
    mockClient.fetch.mockReturnValue(streamOf([]));
    await expect(inboundMailbox.importAll(config, async () => undefined)).resolves.toEqual({
      imported: 0,
      failed: 0,
    });
    expect(release).toHaveBeenCalled();
  });

  it('signs out when the mailbox cannot be opened', async () => {
    mockClient.getMailboxLock.mockRejectedValue(new Error('no such mailbox'));
    await expect(inboundMailbox.importAll(config, async () => undefined)).rejects.toThrow(
      'no such mailbox',
    );
    await expect(inboundMailbox.verify(config)).rejects.toThrow('no such mailbox');
    expect(mockClient.logout).toHaveBeenCalledTimes(2);
    expect(release).not.toHaveBeenCalled();
  });

  it('releases the lock after a successful credentials check', async () => {
    await inboundMailbox.verify(config);
    expect(mockClient.connect).toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
    expect(mockClient.logout).toHaveBeenCalledTimes(1);
  });
});
