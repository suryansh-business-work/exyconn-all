import type { MeetingState } from '../types/meeting';

/** What one look at the visible Meet UI found. Each flag is independent evidence. */
export interface MeetObservation {
  /** The in-call controls (the Leave call button) are on screen. */
  inCall: boolean;
  /** The pre-join screen: "Join now" / "Ask to join". */
  preJoin: boolean;
  /** Waiting to be admitted, or Meet's own "Joining…" screen. */
  joining: boolean;
  /** Meet says it lost the connection and is trying again. */
  reconnecting: boolean;
  /** The call is over for this user: left, removed or ended. */
  ended: boolean;
}

/**
 * Which state the evidence points to, strongest first: an end screen beats everything, a
 * reconnect banner beats the call controls still painted underneath it. Null when nothing
 * recognisable is on screen (Meet mid-render) — the caller keeps the state it had.
 */
export function classifyObservation(observation: MeetObservation): MeetingState | null {
  if (observation.ended) {
    return 'ENDED';
  }
  if (observation.reconnecting) {
    return 'RECONNECTING';
  }
  if (observation.inCall) {
    return 'IN_MEETING';
  }
  if (observation.joining) {
    return 'JOINING';
  }
  if (observation.preJoin) {
    return 'WAITING';
  }
  return null;
}

/** The moves the page can really make. Anything else is a misread and is ignored. */
const ALLOWED: Readonly<Record<MeetingState, ReadonlySet<MeetingState>>> = {
  PAGE_OPENED: new Set(['WAITING', 'JOINING', 'IN_MEETING', 'ENDED', 'DISCONNECTED']),
  WAITING: new Set(['JOINING', 'IN_MEETING', 'ENDED', 'DISCONNECTED']),
  JOINING: new Set(['WAITING', 'IN_MEETING', 'ENDED', 'DISCONNECTED']),
  IN_MEETING: new Set(['RECONNECTING', 'ENDED', 'DISCONNECTED']),
  RECONNECTING: new Set(['IN_MEETING', 'ENDED', 'DISCONNECTED']),
  ENDED: new Set(['WAITING', 'JOINING', 'IN_MEETING', 'DISCONNECTED']),
  DISCONNECTED: new Set(['PAGE_OPENED', 'WAITING', 'JOINING', 'IN_MEETING']),
};

/** True when the page may move from one state to the other. */
export function canTransition(from: MeetingState, to: MeetingState): boolean {
  return ALLOWED[from].has(to);
}

/**
 * The next state given a fresh observation. Unrecognisable screens and impossible moves
 * (a call that "goes back" to the lobby because Meet repainted) keep the current state.
 */
export function nextMeetingState(
  current: MeetingState,
  observation: MeetObservation,
): MeetingState {
  const candidate = classifyObservation(observation);
  if (candidate === null || candidate === current) {
    return current;
  }
  return canTransition(current, candidate) ? candidate : current;
}

/** True once the user is really in the call — the only time a server session is opened. */
export function isLive(state: MeetingState): boolean {
  return state === 'IN_MEETING' || state === 'RECONNECTING';
}
