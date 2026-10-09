import { GraphQLError } from 'graphql';
import { CHAT_SOCKET_PATH } from '../../../../src/modules/website-chat/chat.socket';
import { chatHub, type ChatPeer } from '../../../../src/modules/website-chat/chat.hub';
import { asChatOwner } from '../../../../src/modules/website-chat/chat.owner';
import {
  greetStaff,
  handleStaffFrame,
} from '../../../../src/modules/website-chat/chat.socket.staff';
import {
  greetVisitor,
  handleVisitorFrame,
} from '../../../../src/modules/website-chat/chat.socket.visitor';
import { logger } from '../../../../src/utils/logger';
import { until } from './chat.fixtures';
import { ORIGIN, attach, connect, framesOf, handleUpgrade, message } from './chat.socket.harness';
import ips from '../../../fixtures/ips.json';

jest.mock('ws', () => {
  const handleUpgrade = jest.fn();
  return { WebSocketServer: jest.fn(() => ({ handleUpgrade })), handleUpgrade };
});
jest.mock('../../../../src/modules/website-chat/chat.owner', () => ({ asChatOwner: jest.fn() }));
jest.mock('../../../../src/modules/website-chat/chat.socket.staff', () => ({
  greetStaff: jest.fn(),
  handleStaffFrame: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.socket.visitor', () => ({
  greetVisitor: jest.fn(),
  handleVisitorFrame: jest.fn(),
}));

const mocked = (fn: unknown) => fn as jest.Mock;

beforeEach(() => {
  mocked(asChatOwner).mockImplementation((work: () => Promise<unknown>) => work());
});
afterEach(() => {
  jest.restoreAllMocks();
  for (const peer of chatHub.all()) {
    chatHub.leave(peer);
  }
});

describe('attachChatSocket upgrades', () => {
  it.each([
    ['another path', { url: '/graphql', headers: { origin: ORIGIN } }],
    ['no path', { headers: { origin: ORIGIN } }],
    ['a foreign origin', { url: CHAT_SOCKET_PATH, headers: { origin: 'https://evil.test' } }],
    ['no origin', { url: CHAT_SOCKET_PATH, headers: {} }],
  ])('refuses %s', (_case, req) => {
    const { server } = attach();
    const socket = { destroy: jest.fn() };
    server.emit('upgrade', req, socket, Buffer.alloc(0));
    expect(socket.destroy).toHaveBeenCalled();
    expect(handleUpgrade).not.toHaveBeenCalled();
  });

  it("joins a socket from an allowed origin, addressed by nginx's real IP", () => {
    const { server } = attach();
    const { peer } = connect(server, { 'x-real-ip': ips.ip203_0_113_1 }, ips.ip10_0_0_1);
    expect(peer).toMatchObject({ ip: ips.ip203_0_113_1, role: null, site: 'WEBSITE', alive: true });
    expect(connect(server, {}, ips.ip10_0_0_2).peer.ip).toBe(ips.ip10_0_0_2);
    expect(connect(server).peer.ip).toBe('unknown');
  });
});

describe('a chat socket', () => {
  it('greets a visitor, then passes their frames to the visitor handler in order', async () => {
    mocked(greetVisitor).mockImplementation(async (peer: ChatPeer) => {
      peer.role = 'visitor';
    });
    const { server } = attach();
    const { ws, peer } = connect(server);
    message(ws, { t: 'hello', role: 'visitor', site: 'TOOLS', token: 'pass' });
    message(ws, { t: 'ping' });
    await until(() => mocked(handleVisitorFrame).mock.calls.length > 0);
    expect(greetVisitor).toHaveBeenCalledWith(peer, 'TOOLS', 'pass');
    expect(handleVisitorFrame).toHaveBeenCalledWith(peer, { t: 'ping' });
  });

  it('greets a console, then passes its frames to the staff handler', async () => {
    mocked(greetStaff).mockImplementation(async (peer: ChatPeer) => {
      peer.role = 'staff';
    });
    const { server } = attach();
    const { ws, peer } = connect(server);
    message(ws, { t: 'hello', role: 'staff', token: 'jwt' });
    message(ws, { t: 'ping' });
    await until(() => mocked(handleStaffFrame).mock.calls.length > 0);
    expect(greetStaff).toHaveBeenCalledWith(peer, 'jwt');
    expect(handleStaffFrame).toHaveBeenCalledWith(peer, { t: 'ping' });
    expect(asChatOwner).toHaveBeenCalledTimes(2);
  });

  it('says so when a frame is not JSON, and refuses a bad hello', async () => {
    const { server } = attach();
    const { ws } = connect(server);
    message(ws, '{oops');
    message(ws, { t: 'hello', role: 'robot', clientId: 'h1' });
    await until(() => ws.send.mock.calls.length === 2);
    expect(framesOf(ws)[0]).toEqual({ t: 'error', message: 'That message could not be read.' });
    expect(framesOf(ws)[1]).toMatchObject({ t: 'error', code: 'BAD_USER_INPUT', clientId: 'h1' });
  });

  it('tells the widget when the chat is not available yet', async () => {
    const { server } = attach();
    const { ws } = connect(server);
    mocked(asChatOwner).mockRejectedValueOnce(
      new GraphQLError('The chat is not available yet.', {
        extensions: { code: 'BAD_USER_INPUT' },
      }),
    );
    message(ws, '{not json');
    await until(() => ws.send.mock.calls.length === 1);
    expect(framesOf(ws)).toEqual([
      { t: 'error', message: 'The chat is not available yet.', code: 'BAD_USER_INPUT' },
    ]);
  });

  it('reports our own refusals verbatim and anything else generically, naming the message', async () => {
    const { server } = attach();
    const { ws, peer } = connect(server);
    peer.role = 'visitor';
    mocked(handleVisitorFrame)
      .mockRejectedValueOnce(
        new GraphQLError('Slow down', { extensions: { code: 'TOO_MANY_REQUESTS' } }),
      )
      .mockRejectedValueOnce(new Error('database gone'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    message(ws, { t: 'send', clientId: 'c1' });
    message(ws, { t: 'send', clientId: 42 });
    await until(() => ws.send.mock.calls.length === 2);
    expect(framesOf(ws)).toEqual([
      { t: 'error', message: 'Slow down', code: 'TOO_MANY_REQUESTS', clientId: 'c1' },
      { t: 'error', message: 'Something went wrong. Please try again.' },
    ]);
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Website chat socket frame failed',
    );
  });

  it('closes a socket that never says hello, and keeps one that did', () => {
    const { server } = attach();
    const silent = connect(server);
    silent.helloTimeout();
    expect(silent.ws.close).toHaveBeenCalledWith(4401, 'Say hello first');
    const greeted = connect(server);
    greeted.peer.role = 'visitor';
    greeted.helloTimeout();
    expect(greeted.ws.close).not.toHaveBeenCalled();
  });

  it('leaves the hub on close and logs socket errors', () => {
    const { server } = attach();
    const { ws, peer } = connect(server);
    const cleared = jest.spyOn(globalThis, 'clearTimeout');
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    ws.emit('error', new Error('reset'));
    ws.emit('close');
    expect(warned).toHaveBeenCalledWith({ err: expect.any(Error) }, 'Website chat socket error');
    expect(cleared).toHaveBeenCalledWith('hello-timer');
    expect(chatHub.all().has(peer)).toBe(false);
  });

  it('pings live sockets and terminates ones that stopped answering', () => {
    const { server, heartbeat } = attach();
    const lively = connect(server);
    const dead = connect(server);
    heartbeat();
    expect(lively.ws.ping).toHaveBeenCalledTimes(1);
    expect(lively.peer.alive).toBe(false);
    lively.ws.emit('pong');
    expect(lively.peer.alive).toBe(true);
    heartbeat();
    expect(lively.ws.terminate).not.toHaveBeenCalled();
    expect(dead.ws.terminate).toHaveBeenCalledTimes(1);
  });
});
