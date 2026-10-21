import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { makeTicketed } from '../fixtures';

const mocks = vi.hoisted(() => ({
  servers: [] as Server[],
  connectDatabase: vi.fn(),
  callForTicket: vi.fn(),
  startBrowserCall: vi.fn(),
  startPhoneCall: vi.fn(),
  startTwilioCall: vi.fn(),
  answerXml: vi.fn(() => '<Response/>'),
  answerTwiml: vi.fn(() => '<Response><Connect/></Response>'),
  signedByVobiz: vi.fn(() => true),
  signedByTwilio: vi.fn(() => true),
  phoneHungUp: vi.fn(),
  twilioCallEnded: vi.fn(),
  mongoose: {
    connection: { readyState: 1 },
    ConnectionStates: { connected: 1 },
    disconnect: vi.fn(),
  },
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('node:http', async (importOriginal) => {
  const http = await importOriginal<typeof import('node:http')>();
  const createServer = (listener: Parameters<typeof http.createServer>[0]) => {
    const server = http.createServer(listener);
    mocks.servers.push(server);
    return server;
  };
  return { ...http, default: { ...http, createServer }, createServer };
});
vi.mock('mongoose', () => ({ default: mocks.mongoose }));
vi.mock('../../../src/runtime/db', () => ({ connectDatabase: mocks.connectDatabase }));
vi.mock('../../../src/runtime/env', () => ({
  env: { port: 0, mongoUri: 'mongodb://voice.test/calls', publicUrl: 'https://voice.test/api' },
}));
vi.mock('../../../src/runtime/store', () => ({ callForTicket: mocks.callForTicket }));
vi.mock('../../../src/runtime/log', () => ({
  log: mocks.log,
  errorText: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));
vi.mock('../../../src/runtime/transports/browser', () => ({
  startBrowserCall: mocks.startBrowserCall,
}));
vi.mock('../../../src/runtime/transports/vobiz', () => ({
  answerXml: mocks.answerXml,
  phoneHungUp: mocks.phoneHungUp,
  signedByVobiz: mocks.signedByVobiz,
  startPhoneCall: mocks.startPhoneCall,
}));
vi.mock('../../../src/runtime/transports/twilio', () => ({
  answerTwiml: mocks.answerTwiml,
  signedByTwilio: mocks.signedByTwilio,
  startTwilioCall: mocks.startTwilioCall,
  twilioCallEnded: mocks.twilioCallEnded,
}));

const ticketed = makeTicketed();
const handlers = new Map<string, () => void>();
let base = '';

/** Starts the voice server afresh and waits until it listens. */
async function boot(): Promise<Server> {
  vi.resetModules();
  mocks.servers.length = 0;
  await import('../../../src/runtime/main.js');
  await vi.waitFor(() => {
    expect(mocks.log.info).toHaveBeenCalledWith('voice server listening', { port: 0 });
  });
  const server = mocks.servers[0];
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return server;
}

const post = (path: string, body = '', headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, { method: 'POST', body, headers });

/** Opens a socket to the server: resolves 'open' or 'refused'. */
function connect(path: string): Promise<{ result: 'open' | 'refused'; socket: WebSocket }> {
  const socket = new WebSocket(`${base.replace('http', 'ws')}${path}`);
  return new Promise((resolve) => {
    socket.on('open', () => resolve({ result: 'open', socket }));
    socket.on('error', () => resolve({ result: 'refused', socket }));
  });
}

describe('the voice server', () => {
  let server: Server;

  beforeEach(async () => {
    handlers.clear();
    vi.spyOn(process, 'on').mockImplementation((event, handler) => {
      handlers.set(String(event), handler as () => void);
      return process;
    });
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    mocks.connectDatabase.mockResolvedValue(undefined);
    mocks.mongoose.disconnect.mockResolvedValue(undefined);
    mocks.callForTicket.mockResolvedValue(ticketed);
    mocks.signedByVobiz.mockReturnValue(true);
    mocks.signedByTwilio.mockReturnValue(true);
    mocks.mongoose.connection.readyState = 1;
    mocks.startBrowserCall.mockImplementation(() => undefined);
    mocks.startPhoneCall.mockImplementation(() => undefined);
    server = await boot();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
  });

  it('connects to the database and logs the port it listens on', () => {
    expect(mocks.connectDatabase).toHaveBeenCalledTimes(1);
    expect(mocks.log.info).toHaveBeenCalledWith('voice server listening', { port: 0 });
  });

  it('reports its health from the database connection', async () => {
    const up = await fetch(`${base}/health`);
    expect(up.status).toBe(200);
    await expect(up.text()).resolves.toBe('ok');
    mocks.mongoose.connection.readyState = 0;
    const down = await fetch(`${base}/health`);
    expect(down.status).toBe(503);
    await expect(down.text()).resolves.toBe('database unavailable');
  });

  it('answers 404 for anything else, a callback path asked with GET included', async () => {
    expect((await fetch(`${base}/nowhere`)).status).toBe(404);
    expect((await fetch(`${base}/vobiz/answer`)).status).toBe(404);
    expect((await fetch(`${base}/twilio/answer`)).status).toBe(404);
  });

  it('reads a request without an address as the root path', async () => {
    const response = { writeHead: vi.fn(), end: vi.fn() };
    server.emit('request', { method: 'GET', headers: {} }, response);
    await vi.waitFor(() => {
      expect(response.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
    });
  });

  describe("Vobiz's callbacks", () => {
    it('answers a ticketed call with the stream XML', async () => {
      const response = await post('/vobiz/answer?ticket=t1', 'CallUUID=V1', {
        'x-vobiz-signature-v2': 'sig',
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/xml');
      await expect(response.text()).resolves.toBe('<Response/>');
      expect(mocks.callForTicket).toHaveBeenCalledWith('t1');
      expect(mocks.answerXml).toHaveBeenCalledWith('t1');
      expect(mocks.signedByVobiz).toHaveBeenCalledWith(
        expect.objectContaining({ 'x-vobiz-signature-v2': 'sig' }),
        '/vobiz/answer',
        ticketed.config.vobizAuthToken,
      );
    });

    it('answers with an empty ticket when none was given', async () => {
      await post('/vobiz/answer');
      expect(mocks.callForTicket).toHaveBeenCalledWith('');
      expect(mocks.answerXml).toHaveBeenCalledWith('');
    });

    it('records the hangup with its status, its cause, or nothing', async () => {
      await post('/vobiz/hangup?ticket=t1', 'Status=busy');
      await post('/vobiz/hangup?ticket=t1', 'HangupCause=NORMAL_CLEARING');
      const last = await post('/vobiz/hangup?ticket=t1');
      expect(last.status).toBe(200);
      expect(mocks.phoneHungUp.mock.calls).toEqual([
        [ticketed, 'busy'],
        [ticketed, 'NORMAL_CLEARING'],
        [ticketed, ''],
      ]);
    });

    it('refuses a callback without a live ticket or with a bad signature', async () => {
      mocks.callForTicket.mockResolvedValueOnce(null);
      expect((await post('/vobiz/answer?ticket=bad')).status).toBe(403);
      mocks.signedByVobiz.mockReturnValueOnce(false);
      expect((await post('/vobiz/hangup?ticket=t1')).status).toBe(403);
      expect(mocks.phoneHungUp).not.toHaveBeenCalled();
    });
  });

  describe("Twilio's callbacks", () => {
    it('answers a signed call with TwiML', async () => {
      const response = await post('/twilio/answer?ticket=t1', 'CallSid=CA1', {
        'x-twilio-signature': 'sig',
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/xml');
      expect(mocks.answerTwiml).toHaveBeenCalledWith('t1');
      expect(mocks.signedByTwilio).toHaveBeenCalledWith(
        'sig',
        '/twilio/answer?ticket=t1',
        { CallSid: 'CA1' },
        ticketed.config.twilioAuthToken,
      );
    });

    it('records the end of a call with its status', async () => {
      await post('/twilio/status?ticket=t1', 'CallStatus=completed');
      const last = await post('/twilio/status');
      expect(last.status).toBe(200);
      expect(mocks.callForTicket).toHaveBeenLastCalledWith('');
      expect(mocks.twilioCallEnded.mock.calls).toEqual([
        [ticketed, 'completed'],
        [ticketed, ''],
      ]);
    });

    it('refuses a callback without a live ticket or with a bad signature', async () => {
      mocks.callForTicket.mockResolvedValueOnce(null);
      expect((await post('/twilio/answer?ticket=bad')).status).toBe(403);
      mocks.signedByTwilio.mockReturnValueOnce(false);
      expect((await post('/twilio/status?ticket=t1')).status).toBe(403);
      expect(mocks.twilioCallEnded).not.toHaveBeenCalled();
    });
  });

  it('answers 500 and logs when a request fails', async () => {
    mocks.callForTicket.mockRejectedValueOnce(new Error('db down'));
    const response = await post('/vobiz/answer?ticket=t1');
    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toBe('Internal error');
    expect(mocks.log.error).toHaveBeenCalledWith('request failed', {
      path: '/vobiz/answer',
      error: 'db down',
    });
  });

  describe('audio lines', () => {
    it('opens a browser call once per call, and again after it closes', async () => {
      const first = await connect('/browser?ticket=t1');
      expect(first.result).toBe('open');
      expect(mocks.startBrowserCall).toHaveBeenCalledWith(expect.any(Object), ticketed);
      expect((await connect('/browser?ticket=t1')).result).toBe('refused');
      first.socket.close();
      await vi.waitFor(async () => {
        const again = await connect('/browser?ticket=t1');
        expect(again.result).toBe('open');
        again.socket.close();
      });
    });

    it('opens a Vobiz stream as a phone call', async () => {
      const line = await connect('/vobiz/stream?ticket=t1');
      expect(line.result).toBe('open');
      expect(mocks.startPhoneCall).toHaveBeenCalledWith(expect.any(Object), ticketed);
      expect(mocks.startBrowserCall).not.toHaveBeenCalled();
      line.socket.close();
    });

    it('refuses a line without a live ticket, or on an unknown route', async () => {
      mocks.callForTicket.mockResolvedValueOnce(null);
      expect((await connect('/browser')).result).toBe('refused');
      expect(mocks.callForTicket).toHaveBeenCalledWith('');
      expect((await connect('/elsewhere?ticket=t1')).result).toBe('refused');
      expect(mocks.callForTicket).toHaveBeenCalledTimes(1);
    });

    it('drops the connection and logs when a ticket cannot be checked', async () => {
      mocks.callForTicket.mockRejectedValueOnce(new Error('db down'));
      expect((await connect('/browser?ticket=t1')).result).toBe('refused');
      expect(mocks.log.error).toHaveBeenCalledWith('upgrade failed', { error: 'db down' });
    });

    it('lets a Twilio stream claim its call by ticket, one line per call', async () => {
      const line = await connect('/twilio/stream');
      expect(line.result).toBe('open');
      const claim = mocks.startTwilioCall.mock.calls[0][1] as (
        ticket: string,
      ) => Promise<{ release: () => void } | null>;
      const claimed = await claim('t1');
      expect(claimed).toEqual({ ticketed, release: expect.any(Function) });
      await expect(claim('t1')).resolves.toBeNull();
      claimed?.release();
      await expect(claim('t1')).resolves.not.toBeNull();
      mocks.callForTicket.mockResolvedValueOnce(null);
      await expect(claim('bad')).resolves.toBeNull();
      line.socket.close();
    });
  });

  it('shuts down cleanly on SIGTERM and SIGINT', async () => {
    expect([...handlers.keys()]).toEqual(expect.arrayContaining(['SIGTERM', 'SIGINT']));
    const line = await connect('/browser?ticket=t1');
    const closed = new Promise<number>((resolve) => line.socket.on('close', resolve));
    handlers.get('SIGTERM')?.();
    await expect(closed).resolves.toBe(1001);
    expect(mocks.mongoose.disconnect).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    expect(handlers.get('SIGINT')).toBe(handlers.get('SIGTERM'));
  });

  it('logs a failed database disconnect and still exits on shutdown', async () => {
    mocks.mongoose.disconnect.mockRejectedValueOnce(new Error('socket closed'));
    handlers.get('SIGINT')?.();
    await vi.waitFor(() => {
      expect(mocks.log.error).toHaveBeenCalledWith('database disconnect failed', {
        error: 'socket closed',
      });
    });
    await vi.waitFor(() => {
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});

describe('the voice server failing to start', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('logs and exits when the database cannot be reached', async () => {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    mocks.connectDatabase.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    vi.resetModules();
    mocks.servers.length = 0;
    await import('../../../src/runtime/main.js');
    await vi.waitFor(() => {
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    expect(mocks.log.error).toHaveBeenCalledWith('voice server failed to start', {
      error: 'ECONNREFUSED',
    });
    expect(mocks.servers).toHaveLength(0);
  });
});
