import WebSocket from 'ws';
import { errorText, log } from '../log';

/** Sarvam closes a socket that has been quiet for about a minute; a ping keeps it open. */
const PING_MS = 20_000;

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

  constructor(
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
    this.socket.on('message', (data) => this.receive(data.toString()));
    this.socket.on('error', (error) =>
      log.warn('sarvam socket error', { error: errorText(error) }),
    );
    this.socket.on('close', (code) => {
      clearInterval(this.pinger);
      if (!this.closing) {
        this.events.onFailure(`Sarvam closed the connection (${code})`);
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
