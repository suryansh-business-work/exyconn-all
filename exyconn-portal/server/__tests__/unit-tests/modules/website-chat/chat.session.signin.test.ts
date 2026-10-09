import { Types } from 'mongoose';
import { requestChatCode, verifyChatCode } from '../../../../src/modules/website-chat/chat.session';
import { readChatPass } from '../../../../src/modules/website-chat/chat.token';
import { assignFreeAgent } from '../../../../src/modules/website-chat/chat.assign';
import { ChatMessageModel, ChatSessionModel } from '../../../../src/modules/website-chat/models';
import { emailer } from '../../../../src/modules/email/email.service';
import { fileClientTicket } from '../../../../src/modules/support/client-ticket.service';
import { env } from '../../../../src/config/env';
import { logger } from '../../../../src/utils/logger';
import { codeOf } from '../codeOf';
import { until } from './chat.fixtures';

jest.mock('../../../../src/modules/email/email.service', () => ({ emailer: { send: jest.fn() } }));
jest.mock('../../../../src/modules/support/client-ticket.service', () => ({
  fileClientTicket: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.assign', () => ({
  assignFreeAgent: jest.fn(),
}));

const send = emailer.send as jest.Mock;
const fileTicket = fileClientTicket as jest.Mock;
const assign = assignFreeAgent as jest.Mock;
const IP = '198.51.100.4';

const identity = (fields: Record<string, string> = {}) =>
  ({
    name: 'Dana Reyes',
    email: 'dana@acme.test',
    phone: '',
    pageUrl: '',
    site: 'WEBSITE',
    ...fields,
  }) as const;

/** Asks for a code and reads it back out of the email that was sent. */
async function codeFor(who = identity()): Promise<string> {
  await requestChatCode(who, IP);
  const sent = [...send.mock.calls]
    .reverse()
    .find(([input]) => input.template === 'website-chat-code');
  return sent?.[0].variables.code as string;
}

beforeEach(() => {
  send.mockResolvedValue(undefined);
  assign.mockResolvedValue(undefined);
  fileTicket.mockImplementation(async () => ({ _id: new Types.ObjectId(), reference: 'TCK-42' }));
});
afterEach(() => jest.restoreAllMocks());

describe('requestChatCode', () => {
  it('emails a six-digit code that expires in ten minutes', async () => {
    const code = await codeFor();
    expect(code).toMatch(/^\d{6}$/);
    expect(send).toHaveBeenCalledWith({
      template: 'website-chat-code',
      to: 'dana@acme.test',
      variables: { name: 'Dana Reyes', code, expiresIn: '10 minutes' },
      triggeredBy: 'Website chat sign-in',
    });
  });

  it('refuses when the email cannot be sent', async () => {
    send.mockRejectedValueOnce(new Error('SMTP down'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    await expect(requestChatCode(identity(), IP)).rejects.toThrow(
      'We could not send the code just now. Try again in a minute.',
    );
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Website chat code email failed',
    );
  });

  it('sends at most five codes an hour to one address', async () => {
    for (let i = 0; i < 5; i += 1) {
      await requestChatCode(identity(), IP);
    }
    expect(await codeOf(requestChatCode(identity(), IP))).toBe('TOO_MANY_REQUESTS');
  });
});

describe('verifyChatCode', () => {
  it('opens a session with its ticket, welcome and confirmation, and hands back a pass', async () => {
    const code = await codeFor();
    const result = await verifyChatCode(identity(), code);

    const sessionId = result.session.id;
    expect(readChatPass(result.token)).toEqual({ sessionId, tv: 0 });
    expect(result.session).toMatchObject({
      name: 'Dana Reyes',
      status: 'OPEN',
      ticketReference: 'TCK-42',
    });
    expect(result.messages.map((m) => m.sender)).toEqual(['SYSTEM']);
    expect(result.messages[0].body).toMatch(/^Hi there!/);

    const [ticket, channel] = fileTicket.mock.calls[0];
    expect(channel).toBe('CHAT');
    expect(ticket).toMatchObject({
      requesterName: 'Dana Reyes',
      requesterEmail: 'dana@acme.test',
      subject: 'Website chat with Dana Reyes',
      category: 'OTHER',
      priority: 'MEDIUM',
    });
    expect(ticket.description).toBe(
      [
        'Dana Reyes started a chat on exyconn.com.',
        'Page: not reported',
        'Phone: not given',
        `Conversation: ${env.websiteChatConsoleUrl}/${sessionId}`,
      ].join('\n'),
    );
    const saved = await ChatSessionModel.findById(sessionId).lean();
    expect(saved?.ticketReference).toBe('TCK-42');
    expect(saved?.expiresAt).toBeInstanceOf(Date);
    expect(send).toHaveBeenCalledWith({
      template: 'website-chat-started',
      to: 'dana@acme.test',
      variables: { name: 'Dana Reyes', reference: 'TCK-42' },
      triggeredBy: 'Website chat started',
    });
    expect(assign).toHaveBeenCalledWith(sessionId);
  });

  it('files the page, phone and site the visitor reported', async () => {
    const who = identity({
      site: 'TOOLS',
      pageUrl: 'https://tools.exyconn.com/json',
      phone: '+1 555 0100',
    });
    await verifyChatCode(who, await codeFor(who));
    expect(fileTicket.mock.calls[0][0].description).toContain(
      'Dana Reyes started a chat on tools.exyconn.com.\nPage: https://tools.exyconn.com/json\nPhone: +1 555 0100',
    );
  });

  it('refuses a wrong code without opening anything', async () => {
    const code = await codeFor();
    const wrong = code === '000000' ? '111111' : '000000';
    await expect(verifyChatCode(identity(), wrong)).rejects.toThrow('That code is not right.');
    expect(await ChatSessionModel.countDocuments()).toBe(0);
  });

  it('only logs a confirmation email that fails', async () => {
    const code = await codeFor();
    send.mockRejectedValueOnce(new Error('SMTP down'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    await expect(verifyChatCode(identity(), code)).resolves.toHaveProperty('token');
    await until(() => logged.mock.calls.length > 0);
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Website chat confirmation failed',
    );
  });

  it('answers with the session as saved when it disappears while being assigned', async () => {
    assign.mockImplementation(async (id: string) => {
      await ChatSessionModel.deleteOne({ _id: id });
    });
    const result = await verifyChatCode(identity(), await codeFor());
    expect(result.session.ticketReference).toBe('TCK-42');
    expect(await ChatSessionModel.countDocuments()).toBe(0);
  });

  it('refuses when the session vanished before its ticket was recorded', async () => {
    fileTicket.mockImplementation(async () => {
      await ChatSessionModel.deleteMany({});
      return { _id: new Types.ObjectId(), reference: 'TCK-43' };
    });
    expect(await codeOf(verifyChatCode(identity(), await codeFor()))).toBe('NOT_FOUND');
    expect(await ChatMessageModel.countDocuments()).toBe(0);
  });
});
