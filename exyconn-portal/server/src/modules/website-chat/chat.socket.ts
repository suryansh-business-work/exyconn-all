import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { GraphQLError } from 'graphql';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { env } from '../../config/env';
import { inTurn } from '../../lib/inTurn';
import { logger } from '../../utils/logger';
import { stringOf } from '../../utils/serialize';
import { chatHub, type ChatPeer } from './chat.hub';
import { asChatOwner } from './chat.owner';
import { greetStaff, handleStaffFrame } from './chat.socket.staff';
import { greetVisitor, handleVisitorFrame } from './chat.socket.visitor';
import { helloSchema, parseInput } from './chat.validation';

export const CHAT_SOCKET_PATH = '/chat/ws';

/** A 10 MB file is about 13.4 MB as base64, plus the frame around it. */
const MAX_PAYLOAD_BYTES = 15 * 1024 * 1024;
const HEARTBEAT_MS = 30_000;
/** A socket that has not said who it is by then is closed. */
const HELLO_TIMEOUT_MS = 15_000;

const allowedOrigins = (): ReadonlySet<string> => new Set([...env.chatOrigins, ...env.corsOrigins]);

/** The caller's address: nginx's X-Real-IP in production, the socket's own locally. */
function clientIp(req: IncomingMessage): string {
  const real = req.headers['x-real-ip'];
  return (typeof real === 'string' && real) || req.socket.remoteAddress || 'unknown';
}

/** The `clientId` a frame carried, so an error names the one message that failed. */
function clientIdOf(data: RawData): string | undefined {
  try {
    const clientId = (JSON.parse(stringOf(data)) as { clientId?: unknown }).clientId;
    return typeof clientId === 'string' ? clientId : undefined;
  } catch {
    return undefined;
  }
}

/** Tells the client what went wrong: our own refusals verbatim, anything else generically. */
function reportError(peer: ChatPeer, error: unknown, clientId?: string): void {
  if (error instanceof GraphQLError) {
    chatHub.send(peer, {
      t: 'error',
      message: error.message,
      code: error.extensions.code,
      clientId,
    });
    return;
  }
  logger.error({ err: error }, 'Website chat socket frame failed');
  chatHub.send(peer, { t: 'error', message: 'Something went wrong. Please try again.', clientId });
}

async function dispatch(peer: ChatPeer, data: RawData): Promise<void> {
  let raw: unknown;
  try {
    raw = JSON.parse(stringOf(data));
  } catch {
    chatHub.send(peer, { t: 'error', message: 'That message could not be read.' });
    return;
  }
  if (peer.role === 'visitor') {
    return handleVisitorFrame(peer, raw);
  }
  if (peer.role === 'staff') {
    return handleStaffFrame(peer, raw);
  }
  const hello = parseInput(helloSchema, raw);
  if (hello.role === 'staff') {
    return greetStaff(peer, hello.token);
  }
  return greetVisitor(peer, hello.site, hello.token);
}

let sequence = 0;

function onConnection(socket: WebSocket, req: IncomingMessage): void {
  const peer: ChatPeer = {
    socket,
    ip: clientIp(req),
    role: null,
    site: 'WEBSITE',
    sessionId: null,
    watching: null,
    token: '',
    alive: true,
  };
  sequence += 1;
  const turnKey = `website-chat-peer:${sequence}`;
  chatHub.join(peer);
  const helloTimer = globalThis.setTimeout(() => {
    if (peer.role === null) {
      socket.close(4401, 'Say hello first');
    }
  }, HELLO_TIMEOUT_MS);
  socket.on('pong', () => {
    peer.alive = true;
  });
  // Frames from one socket are handled in the order they came, never side by side.
  socket.on('message', (data) => {
    inTurn(turnKey, () => asChatOwner(() => dispatch(peer, data))).catch((error: unknown) =>
      reportError(peer, error, clientIdOf(data)),
    );
  });
  socket.on('close', () => {
    globalThis.clearTimeout(helloTimer);
    chatHub.leave(peer);
  });
  socket.on('error', (error) => logger.warn({ err: error }, 'Website chat socket error'));
}

/** Closes sockets that stopped answering pings (a laptop lid shut, a dropped network). */
function startHeartbeat(): void {
  globalThis
    .setInterval(() => {
      for (const peer of chatHub.all()) {
        if (!peer.alive) {
          peer.socket.terminate();
          continue;
        }
        peer.alive = false;
        peer.socket.ping();
      }
    }, HEARTBEAT_MS)
    .unref();
}

/**
 * Serves the website chat's socket on the API's own HTTP server, at /chat/ws. Only the
 * public sites and the portals may open it (the Origin header is checked before the upgrade);
 * every other upgrade is refused.
 */
export function attachChatSocket(server: Server): void {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD_BYTES });
  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    const origin = req.headers.origin ?? '';
    if (path !== CHAT_SOCKET_PATH || !allowedOrigins().has(origin)) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => onConnection(ws, req));
  });
  startHeartbeat();
  logger.info(`Website chat socket ready at ${CHAT_SOCKET_PATH}`);
}
