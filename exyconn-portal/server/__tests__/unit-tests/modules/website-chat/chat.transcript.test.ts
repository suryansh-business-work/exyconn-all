import {
  emailTranscript,
  transcriptText,
} from '../../../../src/modules/website-chat/chat.transcript';
import { listMessages } from '../../../../src/modules/website-chat/chat.messages';
import { emailer } from '../../../../src/modules/email/email.service';
import { logger } from '../../../../src/utils/logger';

jest.mock('../../../../src/modules/website-chat/chat.messages', () => ({
  listMessages: jest.fn(),
}));
jest.mock('../../../../src/modules/email/email.service', () => ({
  emailer: { send: jest.fn() },
}));

const list = listMessages as jest.Mock;
const send = emailer.send as jest.Mock;

const session = {
  _id: 'abc',
  name: 'Dana',
  email: 'dana@acme.test',
  ticketReference: 'TCK-7',
};

const line = (fields: Record<string, unknown>) => ({
  channel: 'LIVE',
  sender: 'VISITOR',
  senderName: '',
  body: '',
  attachments: [],
  createdAt: new Date('2026-10-05T04:30:00Z'),
  ...fields,
});

afterEach(() => jest.restoreAllMocks());

describe('transcriptText', () => {
  it("writes each thread in turn, stamped in the chat's timezone", async () => {
    list.mockResolvedValue([
      line({ body: 'Hello?' }),
      line({ sender: 'AGENT', senderName: 'Sam', body: 'Hi Dana' }),
      line({ sender: 'SYSTEM', body: 'Chat ended by Dana.' }),
      line({
        channel: 'KNOWLEDGE',
        sender: 'BOT',
        body: 'See the photo',
        attachments: [{ kind: 'IMAGE', url: 'https://ik.test/p.png' }],
      }),
    ]);
    const text = await transcriptText(session);
    expect(list).toHaveBeenCalledWith('abc');
    expect(text).toBe(
      [
        'Chat TCK-7 with Dana <dana@acme.test>',
        '',
        '== Chat with us ==',
        '[2026-10-05 10:00] You: Hello?',
        '[2026-10-05 10:00] Sam: Hi Dana',
        '[2026-10-05 10:00] Chat: Chat ended by Dana.',
        '',
        '== Knowledge Bot ==',
        '[2026-10-05 10:00] Knowledge Bot: See the photo',
        '  [IMAGE] https://ik.test/p.png',
      ].join('\n'),
    );
  });

  it('leaves out a thread nobody wrote in', async () => {
    list.mockResolvedValue([line({ sender: 'AGENT', body: 'Only live' })]);
    const text = await transcriptText(session);
    expect(text).toContain('[2026-10-05 10:00] Exyconn: Only live');
    expect(text).not.toContain('Knowledge Bot');
  });
});

describe('emailTranscript', () => {
  it('emails the conversation to the visitor as a text attachment', async () => {
    list.mockResolvedValue([line({ body: 'Hello?' })]);
    send.mockResolvedValue(undefined);
    await emailTranscript(session);
    expect(send).toHaveBeenCalledTimes(1);
    const sent = send.mock.calls[0][0];
    expect(sent).toMatchObject({
      template: 'website-chat-transcript',
      to: 'dana@acme.test',
      variables: { name: 'Dana', reference: 'TCK-7' },
      triggeredBy: 'Website chat closed',
    });
    expect(sent.attachments[0].filename).toBe('chat-TCK-7.txt');
    expect(sent.attachments[0].content.toString('utf8')).toContain('You: Hello?');
  });

  it('logs a failure instead of throwing', async () => {
    list.mockResolvedValue([]);
    send.mockRejectedValue(new Error('SMTP down'));
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    await expect(emailTranscript(session)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Website chat transcript email failed',
    );
  });
});
