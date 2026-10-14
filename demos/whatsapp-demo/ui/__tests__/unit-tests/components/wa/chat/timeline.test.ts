import { describe, expect, it } from 'vitest';
import { relativeDay, timeline } from '../../../../../src/components/wa/chat/timeline';
import { message } from '../wa-ui.fixtures';

/** Local-time epoch ms, so day boundaries follow the test machine's timezone like the app. */
const local = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();
const midnight = (y: number, m: number, d: number) => new Date(y, m - 1, d).getTime();

describe('timeline', () => {
  it('is empty for an empty chat', () => {
    expect(timeline([])).toEqual([]);
  });

  it('puts a date chip before the first message of each day', () => {
    const rows = timeline([
      message('a', local(2026, 10, 6, 23, 50)),
      message('b', local(2026, 10, 7, 0, 5)),
      message('c', local(2026, 10, 7, 9)),
    ]);
    expect(rows.map((r) => r.id)).toEqual([
      `day-${midnight(2026, 10, 6)}`,
      'a',
      `day-${midnight(2026, 10, 7)}`,
      'b',
      'c',
    ]);
    expect(rows[0]).toEqual({ kind: 'date', id: rows[0].id, dayMs: midnight(2026, 10, 6) });
  });

  it('gives the tail only to the first bubble of a run from one sender', () => {
    const at = local(2026, 10, 7);
    const rows = timeline([
      message('b1', at),
      message('b2', at),
      message('u1', at, { type: 'text', text: 'hi' }, 'user'),
      message('b3', at),
    ]);
    const tails = rows.flatMap((r) => (r.kind === 'message' ? [[r.id, r.tail]] : []));
    expect(tails).toEqual([
      ['b1', true],
      ['b2', false],
      ['u1', true],
      ['b3', true],
    ]);
  });

  it('treats a system notice as its own sender, so the bubble after it has a tail', () => {
    const at = local(2026, 10, 7);
    const rows = timeline([
      message('b1', at),
      message('n1', at, { type: 'system', text: 'Agent joined' }),
      message('b2', at),
    ]);
    const tails = rows.flatMap((r) => (r.kind === 'message' ? [r.tail] : []));
    expect(tails).toEqual([true, true, true]);
  });

  it('starts a new run on a new day even from the same sender', () => {
    const rows = timeline([message('b1', local(2026, 10, 6)), message('b2', local(2026, 10, 7))]);
    const last = rows.at(-1);
    expect(last?.kind === 'message' && last.tail).toBe(true);
  });
});

describe('relativeDay', () => {
  const now = local(2026, 10, 7, 15);

  it('says Today for the current day', () => {
    expect(relativeDay(midnight(2026, 10, 7), now)).toBe('Today');
  });

  it('says Yesterday for the day before', () => {
    expect(relativeDay(midnight(2026, 10, 6), now)).toBe('Yesterday');
  });

  it('leaves older days to the caller', () => {
    expect(relativeDay(midnight(2026, 10, 5), now)).toBeNull();
    expect(relativeDay(midnight(2026, 10, 8), now)).toBeNull();
  });
});
