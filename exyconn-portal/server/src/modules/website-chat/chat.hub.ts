import type { WebSocket } from 'ws';
import type { ChatSite } from './models';

/** One open chat socket: a visitor's widget or a website team member's console. */
export interface ChatPeer {
  readonly socket: WebSocket;
  readonly ip: string;
  role: 'visitor' | 'staff' | null;
  /** The public site a visitor's widget runs on. */
  site: ChatSite;
  /** The visitor's own session; null until they sign in. */
  sessionId: string | null;
  /** The session a team member has open, which gets typing notices. */
  watching: string | null;
  /** The team member's portal token, re-checked on every action. */
  token: string;
  alive: boolean;
}

/** Something the server tells a socket. `t` names it, as on every frame the client sends. */
export type ServerFrame = { t: string } & Record<string, unknown>;

/**
 * Every open chat socket in this process. In memory on purpose: the API runs as a single
 * container (as the WhatsApp channel's queue assumes), and a socket only lives as long as the
 * process holding it does.
 */
const peers = new Set<ChatPeer>();

function deliver(peer: ChatPeer, frame: ServerFrame): void {
  if (peer.socket.readyState === peer.socket.OPEN) {
    peer.socket.send(JSON.stringify(frame));
  }
}

function broadcast(match: (peer: ChatPeer) => boolean, frame: ServerFrame): void {
  for (const peer of peers) {
    if (match(peer)) {
      deliver(peer, frame);
    }
  }
}

export const chatHub = {
  join: (peer: ChatPeer) => peers.add(peer),
  leave: (peer: ChatPeer) => peers.delete(peer),
  all: (): ReadonlySet<ChatPeer> => peers,
  send: deliver,
  /** Every widget signed in to the session (a visitor may have it open in two tabs). */
  toVisitors: (sessionId: string, frame: ServerFrame) =>
    broadcast((peer) => peer.role === 'visitor' && peer.sessionId === sessionId, frame),
  /** Every widget, signed in or not: a settings change reaches all of them. */
  toAllVisitors: (frame: ServerFrame) => broadcast((peer) => peer.role === 'visitor', frame),
  /** Every team console: the sessions list updates live. */
  toStaff: (frame: ServerFrame) => broadcast((peer) => peer.role === 'staff', frame),
  /** The consoles with this session open. */
  toWatchers: (sessionId: string, frame: ServerFrame) =>
    broadcast((peer) => peer.role === 'staff' && peer.watching === sessionId, frame),
};
