/**
 * The map pin for the chosen centre: a condition on `centreId` and one location node per
 * centre (location coordinates are numbers, so they cannot come from a variable).
 */
import type { AuthorNode } from '../../author';
import { CENTRES } from './data';

const [FIRST, ...REST] = CENTRES;

/** `<prefix>-route` picks the pin; every pin shows `caption` and continues to `next`. */
export function centrePins(prefix: string, caption: string, next: string): AuthorNode[] {
  return [
    {
      id: `${prefix}-route`,
      type: 'condition',
      data: {
        cases: REST.map((c) => ({ id: c.id, var: 'centreId', op: 'eq' as const, value: c.id })),
      },
      next: {
        ...Object.fromEntries(REST.map((c) => [c.id, `${prefix}-${c.id}`])),
        else: `${prefix}-${FIRST.id}`,
      },
    },
    ...CENTRES.map((c): AuthorNode => ({
      id: `${prefix}-${c.id}`,
      type: 'location',
      data: {
        location: { name: c.name, address: c.address, lat: c.lat, lng: c.lng },
        caption,
      },
      next,
    })),
  ];
}
