import type { MeetObservation } from '../../utils/meeting-state';
import { anyVisibleMatches, visibleAll } from './dom';
import {
  CONTROL_SELECTOR,
  ENDED_PHRASES,
  IN_CALL_SELECTOR,
  JOINING_PHRASES,
  PRE_JOIN_PHRASES,
  RECONNECTING_PHRASES,
  STATUS_SELECTOR,
  type Phrases,
} from './selectors';

const TEXT_SELECTOR = `${CONTROL_SELECTOR}, ${STATUS_SELECTOR}`;

const shows = (doc: Document, phrases: Phrases): boolean =>
  anyVisibleMatches(doc, TEXT_SELECTOR, phrases);

/** One look at the visible Meet page; `classifyObservation` turns it into a state. */
export function observeMeetPage(doc: Document): MeetObservation {
  return {
    inCall: visibleAll(doc, IN_CALL_SELECTOR).length > 0,
    preJoin: shows(doc, PRE_JOIN_PHRASES),
    joining: shows(doc, JOINING_PHRASES),
    reconnecting: shows(doc, RECONNECTING_PHRASES),
    ended: shows(doc, ENDED_PHRASES),
  };
}
