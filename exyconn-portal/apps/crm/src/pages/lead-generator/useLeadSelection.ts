import { useState } from 'react';
import type { LeadPlace } from './leadTypes';

/** Which result rows are ticked. Places dropped by a new search fall out of the selection. */
export function useLeadSelection(places: LeadPlace[]) {
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());
  const listed = places.filter((place) => ids.has(place.placeId));

  const toggle = (placeId: string) =>
    setIds((current) => {
      const next = new Set(current);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });

  const toggleAll = () =>
    setIds(listed.length === places.length ? new Set() : new Set(places.map((p) => p.placeId)));

  return { ids, selected: listed, toggle, toggleAll, clear: () => setIds(new Set()) };
}
