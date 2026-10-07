import { EventEmitter } from 'node:events';
import type { Server } from 'node:http';
import {
  attachChatSocket,
  CHAT_SOCKET_PATH,
} from '../../../../src/modules/website-chat/chat.socket';
import { chatHub, type ChatPeer } from '../../../../src/modules/website-chat/chat.hub';
import { env } from '../../../../src/config/env';
import { logger } from '../../../../src/utils/logger';
import type { FakeSocket } from './chat.fixtures';

/**
 * Drives chat.socket.ts without a network: a fake HTTP server emits upgrades and the mocked
 * `ws` server (see chat.socket.test.ts, which declares the mock) hands back fake sockets.
 */
export const { handleUpgrade } = jest.requireMock<{ handleUpgrade: jest.Mock }>('ws');
export const ORIGIN = env.chatOrigins[0];

export type FakeWs = EventEmitter & FakeSocket;

function fakeWs(): FakeWs {
  return Object.assign(new EventEmitter(), {
    readyState: 1,
    OPEN: 1,
    send: jest.fn(),
    close: jest.fn(),
    ping: jest.fn(),
    terminate: jest.fn(),
  });
}

/** Attaches the socket to a fake server, capturing the heartbeat it starts. */
export function attach() {
  const server = new EventEmitter();
  const interval = jest
    .spyOn(globalThis, 'setInterval')
    .mockImplementation((() => ({ unref: jest.fn() })) as unknown as typeof setInterval);
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  attachChatSocket(server as unknown as Server);
  const heartbeat = interval.mock.calls[0][0] as () => void;
  interval.mockRestore();
  return { server, heartbeat };
}

/** Opens one socket through the upgrade, capturing its hello timer. */
export function connect(
  server: EventEmitter,
  headers: Record<string, string> = {},
  remoteAddress?: string,
) {
  const ws = fakeWs();
  handleUpgrade.mockImplementationOnce((_req, _socket, _head, done: (socket: FakeWs) => void) =>
    done(ws),
  );
  const timer = jest
    .spyOn(globalThis, 'setTimeout')
    .mockImplementation((() => 'hello-timer') as unknown as typeof setTimeout);
  const req = {
    url: `${CHAT_SOCKET_PATH}?v=1`,
    headers: { origin: ORIGIN, ...headers },
    socket: { remoteAddress },
  };
  server.emit('upgrade', req, { destroy: jest.fn() }, Buffer.alloc(0));
  const helloTimeout = timer.mock.calls[0][0] as () => void;
  timer.mockRestore();
  const peer = [...chatHub.all()].find((entry) => entry.socket === (ws as unknown));
  return { ws, peer: peer as ChatPeer, helloTimeout };
}

export const message = (ws: FakeWs, frame: unknown) =>
  ws.emit('message', Buffer.from(typeof frame === 'string' ? frame : JSON.stringify(frame)));
export const framesOf = (ws: FakeWs) => ws.send.mock.calls.map(([raw]) => JSON.parse(String(raw)));
