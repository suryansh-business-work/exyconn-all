import {
  greetVisitor,
  handleVisitorFrame,
} from '../../../../src/modules/website-chat/chat.socket.visitor';
import * as session from '../../../../src/modules/website-chat/chat.session';
import * as messages from '../../../../src/modules/website-chat/chat.messages';
import { widgetConfig } from '../../../../src/modules/website-chat/chat.settings';
import { chatHub } from '../../../../src/modules/website-chat/chat.hub';
import { codeOf } from '../codeOf';
import { fakePeer, framesOf } from './chat.fixtures';
import { VISITOR_SESSION, openSession, signedInResult } from './chat.socket.visitor.mocks';

jest.mock('../../../../src/modules/website-chat/chat.session', () => ({
  closeSession: jest.fn(),
  requestChatCode: jest.fn(),
  resumeSession: jest.fn(),
  sessionForPass: jest.fn(),
  startNewChat: jest.fn(),
  verifyChatCode: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.messages', () => ({
  markReadByVisitor: jest.fn(),
  postMessage: jest.fn(),
  rateAnswer: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.settings', () => ({
  readChatSettings: jest.fn(),
  widgetConfig: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.bot', () => ({ answerQuestion: jest.fn() }));
jest.mock('../../../../src/modules/website-chat/chat.handoff', () => ({ handOff: jest.fn() }));
jest.mock('../../../../src/modules/website-chat/chat.slack', () => ({ relayToSlack: jest.fn() }));

const mocked = (fn: unknown) => fn as jest.Mock;
const config = { enabled: true, botName: 'Exy' };
const who = { name: 'Dana', email: 'dana@acme.test' };

beforeEach(() => {
  mocked(widgetConfig).mockResolvedValue(config);
  mocked(session.sessionForPass).mockResolvedValue(openSession());
});
afterEach(() => {
  for (const peer of chatHub.all()) {
    chatHub.leave(peer);
  }
});

const signedIn = () =>
  fakePeer({ role: 'visitor', sessionId: VISITOR_SESSION, token: 'pass-1', site: 'TOOLS' });

describe('greetVisitor', () => {
  it('hands a new widget its config', async () => {
    const { peer, socket } = fakePeer();
    await greetVisitor(peer, 'TOOLS');
    expect(peer).toMatchObject({ role: 'visitor', site: 'TOOLS', sessionId: null });
    expect(framesOf(socket)).toEqual([{ t: 'config', config, site: 'TOOLS' }]);
    expect(session.resumeSession).not.toHaveBeenCalled();
  });

  it('signs a returning widget back in to its session', async () => {
    mocked(session.resumeSession).mockResolvedValue(signedInResult());
    const { peer, socket } = fakePeer();
    await greetVisitor(peer, 'WEBSITE', 'pass-1');
    expect(session.resumeSession).toHaveBeenCalledWith('pass-1');
    expect(peer).toMatchObject({ sessionId: VISITOR_SESSION, token: 'pass-2' });
    expect(framesOf(socket)[1]).toEqual({ t: 'signedIn', ...signedInResult() });
  });

  it('signs a widget out when its pass no longer opens anything', async () => {
    mocked(session.resumeSession).mockResolvedValue(null);
    const { peer, socket } = fakePeer({ sessionId: 'old' });
    await greetVisitor(peer, 'WEBSITE', 'retired');
    expect(peer.sessionId).toBeNull();
    expect(framesOf(socket)[1]).toEqual({ t: 'signedOut' });
  });
});

describe('handleVisitorFrame — signing in', () => {
  it("emails a code to the visitor on their widget's site", async () => {
    const { peer, socket } = fakePeer({ role: 'visitor', site: 'TOOLS' });
    await handleVisitorFrame(peer, { t: 'requestCode', ...who, phone: '+1 555 0100' });
    expect(session.requestChatCode).toHaveBeenCalledWith(
      { ...who, phone: '+1 555 0100', pageUrl: '', site: 'TOOLS' },
      '203.0.113.7',
    );
    expect(framesOf(socket)).toEqual([{ t: 'codeSent', email: 'dana@acme.test' }]);
  });

  it('signs the widget in with a correct code', async () => {
    mocked(session.verifyChatCode).mockResolvedValue(signedInResult('pass-9'));
    const { peer, socket } = fakePeer({ role: 'visitor' });
    await handleVisitorFrame(peer, { t: 'verifyCode', ...who, code: '123456' });
    expect(session.verifyChatCode).toHaveBeenCalledWith(
      { ...who, phone: '', pageUrl: '', site: 'WEBSITE' },
      '123456',
    );
    expect(peer.token).toBe('pass-9');
    expect(framesOf(socket)[0]).toMatchObject({ t: 'signedIn', token: 'pass-9' });
  });

  it('starts a new chat from the pass the widget holds', async () => {
    mocked(session.startNewChat).mockResolvedValue(signedInResult('pass-3'));
    const { peer } = signedIn();
    await handleVisitorFrame(peer, { t: 'newChat' });
    expect(session.startNewChat).toHaveBeenCalledWith('pass-1');
    expect(peer.token).toBe('pass-3');
  });
});

describe('handleVisitorFrame — in a chat', () => {
  it("shows the team the visitor's typing", async () => {
    const { peer } = signedIn();
    const watcher = fakePeer({ role: 'staff', watching: VISITOR_SESSION });
    chatHub.join(watcher.peer);
    await handleVisitorFrame(peer, { t: 'typing', on: true });
    expect(framesOf(watcher.socket)).toEqual([
      { t: 'typing', sessionId: VISITOR_SESSION, who: 'VISITOR', name: 'Dana', on: true },
    ]);
  });

  it('marks replies read and rates answers only once signed in', async () => {
    const { peer } = signedIn();
    await handleVisitorFrame(peer, { t: 'read' });
    await handleVisitorFrame(peer, { t: 'feedback', messageId: VISITOR_SESSION, helpful: false });
    expect(messages.markReadByVisitor).toHaveBeenCalledWith(VISITOR_SESSION);
    expect(messages.rateAnswer).toHaveBeenCalledWith(VISITOR_SESSION, VISITOR_SESSION, false);

    const anonymous = fakePeer({ role: 'visitor' });
    await handleVisitorFrame(anonymous.peer, { t: 'read' });
    await handleVisitorFrame(anonymous.peer, {
      t: 'feedback',
      messageId: VISITOR_SESSION,
      helpful: true,
    });
    expect(messages.markReadByVisitor).toHaveBeenCalledTimes(1);
    expect(messages.rateAnswer).toHaveBeenCalledTimes(1);
  });

  it("ends the chat in the visitor's name", async () => {
    const { peer } = signedIn();
    await handleVisitorFrame(peer, { t: 'end' });
    expect(session.closeSession).toHaveBeenCalledWith(VISITOR_SESSION, 'Dana');
  });

  it('refuses chat actions from a widget that is not signed in to that session', async () => {
    const anonymous = fakePeer({ role: 'visitor' });
    await expect(handleVisitorFrame(anonymous.peer, { t: 'end' })).rejects.toThrow(
      'Sign in to chat.',
    );
    expect(session.sessionForPass).not.toHaveBeenCalled();

    const other = fakePeer({ role: 'visitor', sessionId: 'another', token: 'pass-1' });
    await expect(handleVisitorFrame(other.peer, { t: 'typing', on: false })).rejects.toThrow(
      'Sign in to chat.',
    );
    mocked(session.sessionForPass).mockResolvedValueOnce(null);
    await expect(handleVisitorFrame(signedIn().peer, { t: 'end' })).rejects.toThrow(
      'Sign in to chat.',
    );
    mocked(session.sessionForPass).mockResolvedValueOnce(openSession({ status: 'CLOSED' }));
    await expect(handleVisitorFrame(signedIn().peer, { t: 'end' })).rejects.toThrow(
      'This chat has ended. Start a new one.',
    );
    expect(session.closeSession).not.toHaveBeenCalled();
  });

  it('sends the config again on request, answers pings and refuses unknown frames', async () => {
    const { peer, socket } = signedIn();
    await handleVisitorFrame(peer, { t: 'getConfig' });
    await handleVisitorFrame(peer, { t: 'ping' });
    expect(framesOf(socket)).toEqual([{ t: 'config', config, site: 'TOOLS' }, { t: 'pong' }]);
    expect(await codeOf(handleVisitorFrame(peer, { t: 'hack' }))).toBe('BAD_USER_INPUT');
  });
});
