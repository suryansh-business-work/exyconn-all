/**
 * Deterministic dummy data: the same seed gives the same booking ids, prices and slots, so a
 * chat reloaded from storage reads the same and a screenshot is repeatable.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** mulberry32 — tiny, fast, good enough for dummy data. */
function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable 32-bit number from a string (FNV-1a). */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0) as number;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Local midnight of the day `ms` falls on. */
export function startOfDay(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export interface DummyData {
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  /** e.g. id("CC") -> "CC-4KQ7W2". */
  id: (prefix: string) => string;
  /** The next `count` days from tomorrow (local midnight, epoch ms). */
  nextDays: (count: number, skipSundays?: boolean) => number[];
  /** Free slots on a day (epoch ms) between `from` and `to` hours, a few taken at random. */
  slots: (dayMs: number, from: number, to: number, stepMin: number, take: number) => number[];
  /** A price near `base`, rounded to tens. */
  price: (base: number, spreadPct?: number) => number;
}

export function createDummy(seed: number, now: number): DummyData {
  const random = generator(seed);
  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  return {
    int,
    pick: (items) => items[int(0, items.length - 1)],
    id: (prefix) =>
      `${prefix}-${Array.from({ length: 6 }, () => ID_ALPHABET[int(0, ID_ALPHABET.length - 1)]).join('')}`,
    nextDays: (count, skipSundays = false) => {
      const days: number[] = [];
      for (let offset = 1; days.length < count && offset < count * 2 + 2; offset += 1) {
        const day = startOfDay(now) + offset * DAY_MS;
        if (!skipSundays || new Date(day).getDay() !== 0) {
          days.push(startOfDay(day + DAY_MS / 2));
        }
      }
      return days;
    },
    slots: (dayMs, from, to, stepMin, take) => {
      const all: number[] = [];
      for (let minute = from * 60; minute < to * 60; minute += stepMin) {
        all.push(startOfDay(dayMs) + minute * 60 * 1000);
      }
      const free = all.filter((slot) => slot > now && random() > 0.3);
      return free.slice(0, take);
    },
    price: (base, spreadPct = 10) => {
      const spread = base * (spreadPct / 100);
      return Math.round((base - spread + random() * spread * 2) / 10) * 10;
    },
  };
}
