import WebSocket from 'ws';
import { errorText, log } from '../log';

/** Sarvam closes a socket that has been quiet for about a minute; a ping keeps it open. */
const PING_MS = 20_000;

/** Sarvam's close code for a key it turns away: invalid, out of credits or rate-limited. */
const KEY_REFUSED = 1003;

/** What the person fixing it should check, appended to a refusal of the key. */
const KEY_HINT = 'Check the Sarvam AI key and its credits in Tech > Demos > Calling bot.';

/**
 * Why a socket closed, in words Tech > Demos > Calling bot > Calls can show: the close code,
 * Sarvam's own reason (or the handshake's HTTP status, which `ws` reports as an error) and,
 * when the key was refused, where to fix it. Never the key itself.
 */
function closeReason(name: string, code: number, reason: string, error: string): string {
  const detail = reason || error;
  const said = detail ? `${code}: ${detail}` : String(code);
  const refused = code === KEY_REFUSED || /\b40[13]\b/.test(error);
  const hint = refused ? ` ${KEY_HINT}` : '';
  return `${name} closed the connection (${said}).${hint}`;
}

/** What a Sarvam socket reports back. */
export interface SocketEvents {
  onMessage: (message: Record<string, unknown>) => void;
  onFailure: (reason: string) => void;
}

/**
 * One streaming connection to Sarvam: JSON messages both ways, sent once the socket is open
 * (anything sent before then waits), kept alive with pings, and closed on purpose without it
 * counting as a failure.
 */
export class SarvamSocket {
  private readonly socket: WebSocket;
  private readonly waiting: string[] = [];
  private readonly pinger: NodeJS.Timeout;
  private closing = false;
  /** The last socket error, e.g. a refused handshake ("Unexpected server response: 403"). */
  private lastError = '';

  constructor(
    /** Which Sarvam service this is, for the failure reason: "Sarvam text-to-speech". */
    private readonly name: string,
    url: string,
    headers: Record<string, string>,
    ping: Record<string, unknown>,
    private readonly events: SocketEvents,
  ) {
    this.socket = new WebSocket(url, { headers });
    this.socket.on('open', () => {
      for (const message of this.waiting.splice(0)) {
        this.socket.send(message);
      }
    });
    this.socket.on('message', (data: Buffer) => this.receive(data.toString('utf8')));
    this.socket.on('error', (error) => {
      this.lastError = errorText(error);
      log.warn('sarvam socket error', { service: this.name, error: this.lastError });
    });
    this.socket.on('close', (code, reason) => {
      clearInterval(this.pinger);
      if (!this.closing) {
        this.events.onFailure(closeReason(this.name, code, reason.toString(), this.lastError));
      }
    });
    this.pinger = setInterval(() => this.send(ping), PING_MS);
  }

  send(message: Record<string, unknown>): void {
    const text = JSON.stringify(message);
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(text);
    } else if (this.socket.readyState === WebSocket.CONNECTING) {
      this.waiting.push(text);
    }
  }

  close(farewell?: Record<string, unknown>): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    clearInterval(this.pinger);
    if (farewell && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(farewell));
    }
    this.socket.close();
  }

  private receive(text: string): void {
    try {
      this.events.onMessage(JSON.parse(text) as Record<string, unknown>);
    } catch (error) {
      log.warn('unreadable sarvam message', { error: errorText(error) });
    }
  }
}
