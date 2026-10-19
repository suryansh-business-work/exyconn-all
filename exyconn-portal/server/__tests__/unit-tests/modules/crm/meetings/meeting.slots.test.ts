import {
  freeSlots,
  type Availability,
} from '../../../../../src/modules/crm/meetings/meeting.slots';

/** Mondays 09:00-12:00 UTC in hour-long meetings; Tuesday listed but switched off. */
const monday: Availability = {
  durationMinutes: 60,
  timezone: 'UTC',
  weeklyHours: [
    { day: 1, enabled: true, start: '09:00', end: '12:00' },
    { day: 2, enabled: false, start: '09:00', end: '12:00' },
  ],
  bufferMinutes: 0,
  minNoticeHours: 0,
  maxDaysAhead: 30,
};

const at = (iso: string) => new Date(iso);
const isoOf = (slots: Date[]) => slots.map((slot) => slot.toISOString());

const MON = at('2026-10-19T00:00:00.000Z');
const WED = at('2026-10-21T00:00:00.000Z');
const BEFORE = at('2026-10-18T00:00:00.000Z');

describe('freeSlots', () => {
  it('offers every start inside the enabled weekly hours and none on a switched-off day', () => {
    expect(isoOf(freeSlots(monday, MON, WED, [], BEFORE))).toEqual([
      '2026-10-19T09:00:00.000Z',
      '2026-10-19T10:00:00.000Z',
      '2026-10-19T11:00:00.000Z',
    ]);
  });

  it('never offers a meeting that would run past the close of the day', () => {
    const short = {
      ...monday,
      weeklyHours: [{ day: 1, enabled: true, start: '09:00', end: '10:30' }],
    };

    expect(isoOf(freeSlots(short, MON, WED, [], BEFORE))).toEqual(['2026-10-19T09:00:00.000Z']);
  });

  it('keeps the minimum notice from now', () => {
    const slots = freeSlots(
      { ...monday, minNoticeHours: 1 },
      MON,
      WED,
      [],
      at('2026-10-19T08:30:00.000Z'),
    );

    expect(isoOf(slots)).toEqual(['2026-10-19T10:00:00.000Z', '2026-10-19T11:00:00.000Z']);
  });

  it('stops at the furthest day ahead a meeting may be booked', () => {
    const slots = freeSlots(
      { ...monday, maxDaysAhead: 1 },
      MON,
      WED,
      [],
      at('2026-10-18T10:00:00.000Z'),
    );

    expect(isoOf(slots)).toEqual(['2026-10-19T09:00:00.000Z']);
  });

  it('stops at the end of the period asked for', () => {
    expect(isoOf(freeSlots(monday, MON, at('2026-10-19T10:00:00.000Z'), [], BEFORE))).toEqual([
      '2026-10-19T09:00:00.000Z',
    ]);
  });

  it('leaves out a start that is already booked, and keeps its neighbours', () => {
    const busy = [
      { startAt: at('2026-10-19T10:00:00.000Z'), endAt: at('2026-10-19T11:00:00.000Z') },
    ];

    expect(isoOf(freeSlots(monday, MON, WED, busy, BEFORE))).toEqual([
      '2026-10-19T09:00:00.000Z',
      '2026-10-19T11:00:00.000Z',
    ]);
  });

  it('keeps the buffer clear either side of a booked meeting', () => {
    const busy = [
      { startAt: at('2026-10-19T10:00:00.000Z'), endAt: at('2026-10-19T11:00:00.000Z') },
    ];

    expect(freeSlots({ ...monday, bufferMinutes: 30 }, MON, WED, busy, BEFORE)).toEqual([]);
  });

  it('reads the hours in the host zone and counts a 25-hour day once', () => {
    // New York falls back on Sunday 1 November 2026: a day-long step from 00:30 lands at 23:30
    // the same day, which must not open that day's hours twice.
    const sunday: Availability = {
      ...monday,
      timezone: 'America/New_York',
      weeklyHours: [{ day: 0, enabled: true, start: '09:00', end: '11:00' }],
    };

    const slots = freeSlots(
      sunday,
      at('2026-11-01T04:30:00.000Z'),
      at('2026-11-01T23:00:00.000Z'),
      [],
      at('2026-10-31T00:00:00.000Z'),
    );

    expect(isoOf(slots)).toEqual(['2026-11-01T14:00:00.000Z', '2026-11-01T15:00:00.000Z']);
  });
});
