import type { SeenParticipant } from '../../types/meeting';
import { toSeenParticipant } from '../../utils/participants';
import { isVisible, visibleAll } from './dom';
import {
  PEOPLE_ITEM_SELECTOR,
  PEOPLE_LIST_SELECTOR,
  SELF_NAME_ATTRIBUTE,
  TILE_NAME_SELECTOR,
  TILE_SELECTOR,
} from './selectors';

export interface ParticipantsRead {
  participants: SeenParticipant[];
  /** True when the full People list was visible, so absences mean departures. */
  complete: boolean;
}

function fromPeopleList(list: Element): SeenParticipant[] {
  return [...list.querySelectorAll(PEOPLE_ITEM_SELECTOR)]
    .map((item) => toSeenParticipant(item.getAttribute('aria-label') ?? item.textContent, false))
    .filter((person): person is SeenParticipant => person !== null);
}

function fromTiles(doc: Document): SeenParticipant[] {
  return visibleAll(doc, TILE_SELECTOR)
    .map((tile) => {
      const name = tile.querySelector(TILE_NAME_SELECTOR);
      if (name === null) {
        return null;
      }
      return toSeenParticipant(name.textContent, name.hasAttribute(SELF_NAME_ATTRIBUTE));
    })
    .filter((person): person is SeenParticipant => person !== null);
}

/**
 * Who is visibly in the call: the People panel when it is open (complete), else the video
 * tiles on screen (partial). Display names only — never emails or hidden data.
 */
export function readParticipants(doc: Document): ParticipantsRead {
  const list = doc.querySelector(PEOPLE_LIST_SELECTOR);
  if (list !== null && isVisible(list)) {
    return { participants: fromPeopleList(list), complete: true };
  }
  return { participants: fromTiles(doc), complete: false };
}
