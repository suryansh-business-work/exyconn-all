import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import mongoose from 'mongoose';
import { WebSocketServer } from 'ws';
import { TICKET_PARAM, VOICE_PATHS } from '../index';
import { connectDatabase } from './db';
import { env } from './env';
import { readBody, reply } from './http';
import { errorText, log } from './log';
import { callForTicket } from './store';
import { startBrowserCall } from './transports/browser';
import { answerXml, phoneHungUp, signedByVobiz, startPhoneCall } from './transports/vobiz';

/** The calls with an open audio line, so a ticket cannot open a second one. */
const live = new Set<string>();

const sockets = new WebSocketServer({ noServer: true });

function urlOf(request: IncomingMessage): URL {
  return new URL(request.url ?? '/', 'http://voice.internal');
}

async function vobizCallback(request: IncomingMessage, response: ServerResponse, path: string) {
  const ticketed = await callForTicket(urlOf(request).searchParams.get(TICKET_PARAM) ?? '');
  if (!ticketed || !signedByVobiz(request.headers, path, ticketed.config.vobizAuthToken)) {
    reply(response, 403, 'Forbidden');
    return;
  }
  const body = await readBody(request);
  if (path === VOICE_PATHS.vobizAnswer) {
    reply(
      response,
      200,
      answerXml(urlOf(request).searchParams.get(TICKET_PARAM) ?? ''),
      'application/xml',
    );
    return;
  }
  await phoneHungUp(ticketed, body.Status ?? body.HangupCause ?? '');
  reply(response, 200, 'OK');
}

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const { pathname } = urlOf(request);
  if (pathname === VOICE_PATHS.health) {
    const up = mongoose.connection.readyState === mongoose.ConnectionStates.connected;
    reply(response, up ? 200 : 503, up ? 'ok' : 'database unavailable');
    return;
  }
  const callback = pathname === VOICE_PATHS.vobizAnswer || pathname === VOICE_PATHS.vobizHangup;
  if (request.method === 'POST' && callback) {
    await vobizCallback(request, response, pathname);
    return;
  }
  reply(response, 404, 'Not found');
}

async function upgrade(request: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
  const url = urlOf(request);
  const route = url.pathname;
  const isCall = route === VOICE_PATHS.browser || route === VOICE_PATHS.vobizStream;
  const ticketed = isCall ? await callForTicket(url.searchParams.get(TICKET_PARAM) ?? '') : null;
  const id = ticketed ? String(ticketed.call._id) : '';
  if (!ticketed || live.has(id)) {
    socket.destroy();
    return;
  }
  live.add(id);
  sockets.handleUpgrade(request, socket, head, (ws) => {
    ws.on('close', () => live.delete(id));
    if (route === VOICE_PATHS.browser) {
      startBrowserCall(ws, ticketed);
    } else {
      startPhoneCall(ws, ticketed);
    }
  });
}

async function main(): Promise<void> {
  await connectDatabase();
  const server = createServer((request, response) => {
    handle(request, response).catch((error) => {
      log.error('request failed', { path: urlOf(request).pathname, error: errorText(error) });
      reply(response, 500, 'Internal error');
    });
  });
  server.on('upgrade', (request, socket, head) => {
    upgrade(request, socket, head).catch((error) => {
      log.error('upgrade failed', { error: errorText(error) });
      socket.destroy();
    });
  });
  server.listen(env.port, () => log.info('voice server listening', { port: env.port }));
  const stop = () => {
    server.close();
    sockets.clients.forEach((client) => client.close(1001));
    mongoose.disconnect().finally(() => process.exit(0));
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}

main().catch((error) => {
  log.error('voice server failed to start', { error: errorText(error) });
  process.exit(1);
});
