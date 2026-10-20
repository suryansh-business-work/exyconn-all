import { EMAIL } from '@exyconn/regex';
import type { SeenParticipant } from '../types/meeting';

/** Meet's own markers for the signed-in user's tile or list row. */
const SELF_MARKERS = ['(You)', '(you)'];

export type ParticipantEventKind = 'JOINED' | 'LEFT';

/** One change, shaped like the server's `MaParticipantEventInput`. */
export interface ParticipantEvent {
  key: string;
  displayName: string;
  event: ParticipantEventKind;
  at: string;
  isSelf: boolean;
}

/** A display name as shown, without Meet's "(You)" marker and with spacing tidied. */
export function cleanDisplayName(raw: string): string {
  let name = raw;
  for (const marker of SELF_MARKERS) {
    name = name.replaceAll(marker, '');
  }
  return name.replaceAll(/\s+/g, ' ').trim();
}

/** The diff key: the cleaned name, case-folded. Two people with one name count once. */
export function participantKey(displayName: string): string {
  return cleanDisplayName(displayName).toLocaleLowerCase();
}

/**
 * A participant read from the page, or null when the text is empty or is an email address —
 * the extension never collects emails from the call UI.
 */
export function toSeenParticipant(rawName: string | null, isSelf: boolean): SeenParticipant | null {
  if (rawName === null) {
    return null;
  }
  const displayName = cleanDisplayName(rawName);
  if (displayName.length === 0 || EMAIL.test(displayName)) {
    return null;
  }
  const self = isSelf || SELF_MARKERS.some((marker) => rawName.includes(marker));
  return { key: participantKey(displayName), displayName, isSelf: self };
}

export interface ParticipantDiff {
  events: ParticipantEvent[];
  roster: Map<string, SeenParticipant>;
}

/**
 * JOINED/LEFT events between the last roster and what is visible now.
 *
 * `complete` is true only when the full People list is on screen. From tiles alone a person
 * scrolled out of view is indistinguishable from one who left, so an incomplete look only
 * ever adds people and never reports a departure.
 */
export function diffParticipants(
  previous: ReadonlyMap<string, SeenParticipant>,
  visible: readonly SeenParticipant[],
  complete: boolean,
  at: string,
): ParticipantDiff {
  const events: ParticipantEvent[] = [];
  const roster = new Map<string, SeenParticipant>();
  for (const person of visible) {
    if (roster.has(person.key)) {
      continue;
    }
    roster.set(person.key, person);
    if (!previous.has(person.key)) {
      events.push({ ...person, event: 'JOINED', at });
    }
  }
  for (const [key, person] of previous) {
    if (roster.has(key)) {
      continue;
    }
    if (complete) {
      events.push({ ...person, event: 'LEFT', at });
    } else {
      roster.set(key, person);
    }
  }
  return { events, roster };
}
