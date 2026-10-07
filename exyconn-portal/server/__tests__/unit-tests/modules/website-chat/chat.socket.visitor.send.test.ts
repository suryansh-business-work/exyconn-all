import { handleVisitorFrame } from '../../../../src/modules/website-chat/chat.socket.visitor';
import { sessionForPass } from '../../../../src/modules/website-chat/chat.session';
import { postMessage } from '../../../../src/modules/website-chat/chat.messages';
import { readChatSettings } from '../../../../src/modules/website-chat/chat.settings';
import { answerQuestion } from '../../../../src/modules/website-chat/chat.bot';
import { handOff } from '../../../../src/modules/website-chat/chat.handoff';
import { relayToSlack } from '../../../../src/modules/website-chat/chat.slack';
import { uploadChatFiles } from '../../../../src/modules/website-chat/chat.media';
import { codeOf } from '../codeOf';
import { fakePeer } from './chat.fixtures';
import { VISITOR_SESSION, openSession, settingsFor } from './chat.socket.visitor.mocks';

jest.mock('../../../../src/modules/website-chat/chat.session', () => ({
  sessionForPass: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.messages', () => ({ postMessage: jest.fn() }));
jest.mock('../../../../src/modules/website-chat/chat.settings', () => ({
  readChatSettings: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.bot', () => ({ answerQuestion: jest.fn() }));
jest.mock('../../../../src/modules/website-chat/chat.handoff', () => ({ handOff: jest.fn() }));
jest.mock('../../../../src/modules/website-chat/chat.slack', () => ({ relayToSlack: jest.fn() }));
jest.mock('../../../../src/modules/website-chat/chat.media', () => ({
  uploadChatFiles: jest.fn(),
}));

const mocked = (fn: unknown) => fn as jest.Mock;
const picture = { name: 'p.png', data: 'data:image/png;base64,AAAA' };
const attachment = { url: 'https://ik.test/p.png', name: 'p.png', kind: 'IMAGE', size: 3 };

const send = (fields: Record<string, unknown>) => {
  const { peer } = fakePeer({ role: 'visitor', sessionId: VISITOR_SESSION, token: 'pass-1' });
  return handleVisitorFrame(peer, {
    t: 'send',
    clientId: 'c1',
    channel: 'LIVE',
    body: 'Hello',
    ...fields,
  });
};

beforeEach(() => {
  mocked(sessionForPass).mockResolvedValue(openSession());
  mocked(readChatSettings).mockResolvedValue(settingsFor(true));
  mocked(uploadChatFiles).mockImplementation(async (files: unknown[]) =>
    files.map(() => attachment),
  );
});

describe('a visitor sending a message', () => {
  it('posts a live message, relays it to Slack and leaves it for the team while on duty', async () => {
    await send({ files: [picture] });
    expect(uploadChatFiles).toHaveBeenCalledWith([picture], 10);
    expect(postMessage).toHaveBeenCalledWith(
      {
        sessionId: VISITOR_SESSION,
        sender: 'VISITOR',
        senderName: 'Dana',
        body: 'Hello',
        channel: 'LIVE',
        attachments: [attachment],
      },
      'c1',
    );
    expect(relayToSlack).toHaveBeenCalledWith(openSession(), 'Dana', 'Hello', [attachment]);
    expect(handOff).not.toHaveBeenCalled();
    expect(answerQuestion).not.toHaveBeenCalled();
  });

  it('hands the question to the bot at once outside opening hours', async () => {
    mocked(readChatSettings).mockResolvedValue(settingsFor(false));
    await send({});
    expect(handOff).toHaveBeenCalledWith(VISITOR_SESSION, 'We are away.');
  });

  it('asks the bot in the knowledge thread, without Slack', async () => {
    await send({ channel: 'KNOWLEDGE', body: 'What do you build?' });
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'KNOWLEDGE', attachments: [] }),
      'c1',
    );
    expect(answerQuestion).toHaveBeenCalledWith(VISITOR_SESSION, 'What do you build?', 'KNOWLEDGE');
    expect(relayToSlack).not.toHaveBeenCalled();
    expect(handOff).not.toHaveBeenCalled();
  });

  it('sends a file with no text', async () => {
    await send({ body: '', files: [picture] });
    expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ body: '' }), 'c1');
  });

  it('refuses files to the bot, files when uploads are off, and an empty message', async () => {
    await expect(send({ channel: 'KNOWLEDGE', files: [picture] })).rejects.toThrow(
      'The knowledge bot reads text only.',
    );
    mocked(readChatSettings).mockResolvedValue(settingsFor(true, { allowUploads: false }));
    await expect(send({ files: [picture] })).rejects.toThrow('Files cannot be sent in this chat.');
    await expect(send({ body: '   ' })).rejects.toThrow('Write a message first.');
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('refuses a message once the chat has ended', async () => {
    mocked(sessionForPass).mockResolvedValue(openSession({ status: 'CLOSED' }));
    expect(await codeOf(send({}))).toBe('BAD_USER_INPUT');
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('limits a session to sixty messages a minute', async () => {
    for (let i = 0; i < 60; i += 1) {
      await send({});
    }
    expect(await codeOf(send({}))).toBe('TOO_MANY_REQUESTS');
    expect(postMessage).toHaveBeenCalledTimes(60);
  });
});
