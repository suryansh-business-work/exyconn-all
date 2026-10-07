/**
 * Valid answers for the seed walk: one per input kind, and entity values shaped like the
 * portal server's AI reader returns them.
 */
import type { EntityKind, InputKind } from '../../../src/schema';
import { NOW } from '../engine/fixtures';

const DAY = 24 * 60 * 60 * 1000;

export const ANSWERS: Readonly<Record<InputKind, string>> = {
  name: 'Asha Rao',
  phone: '98765 43210',
  email: 'asha@example.com',
  date: '14/08/1990',
  pincode: '411045',
  number: '32000',
  text: 'Some detail about it',
};

const TIMED: ReadonlySet<EntityKind> = new Set(['date', 'time', 'datetime']);

/**
 * What the server's reader returns for one entity: a readable value, plus `<name>Ms` (epoch)
 * beside every date or time, as `pickAnswer` in the portal server does.
 */
export function entityValues(name: string, kind: EntityKind, high: boolean): [string, string][] {
  const values: Readonly<Record<EntityKind, string>> = {
    name: 'Asha Rao',
    phone: '+91 98765 43210',
    email: 'asha@example.com',
    date: 'tomorrow',
    time: '5 pm',
    datetime: 'tomorrow 5 pm',
    location: 'Baner, Pune',
    number: high ? '101' : '3',
    text: 'left side',
  };
  const readable: [string, string] = [name, values[kind]];
  return TIMED.has(kind)
    ? [readable, [`${name}Ms`, String(NOW + DAY + 8 * 60 * 60 * 1000)]]
    : [readable];
}
