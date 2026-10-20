import { trackerLocationService } from '../../../../src/modules/tracker/tracker.location.service';
import { TrackerLocationModel, TrackerSessionModel } from '../../../../src/modules/tracker/models';
import { freezeClock } from '../../../helpers';
import { officeFix } from '../../../fixtures/location';
import { codeOf } from '../codeOf';

const USER = 'emp-location';
// 23:30 UTC on 5 Jan is already 6 Jan in Kolkata: pins are filed under the local day.
const NOW = '2026-01-05T23:30:00Z';
const LOCAL_DAY = new Date('2026-01-06T00:00:00Z');

/** A fix this many metres north of the office (0.0018° of latitude ≈ 200 m). */
const northOfOffice = (metres: number) => ({
  ...officeFix,
  lat: officeFix.lat + (metres / 200) * 0.0018,
  capturedAt: new Date(NOW),
});

const startTracking = () =>
  TrackerSessionModel.create({ userId: USER, deviceId: 'd1', startedAt: new Date(NOW) });

beforeEach(() => freezeClock(NOW));
afterEach(() => jest.useRealTimers());

describe('recordAttendance', () => {
  it('pins the fix on the employee’s local day as an ATTENDANCE pin', async () => {
    await trackerLocationService.recordAttendance(USER, 'Asia/Kolkata', officeFix);

    const pins = await TrackerLocationModel.find().lean();
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({
      userId: USER,
      day: LOCAL_DAY,
      kind: 'ATTENDANCE',
      lat: officeFix.lat,
      lng: officeFix.lng,
      accuracyM: 20,
      source: 'GPS',
      capturedAt: officeFix.capturedAt,
    });
  });

  it.each([
    ['a latitude past the pole', { lat: 90.5 }],
    ['a longitude past the date line', { lng: -180.1 }],
    ['a negative accuracy', { accuracyM: -1 }],
    ['a NaN coordinate', { lat: Number.NaN }],
    ['an infinite accuracy', { accuracyM: Number.POSITIVE_INFINITY }],
    ['an unreadable time', { capturedAt: new Date('not a date') }],
  ])('refuses %s and writes nothing', async (_label, patch) => {
    await expect(
      codeOf(trackerLocationService.recordAttendance(USER, 'UTC', { ...officeFix, ...patch })),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(await TrackerLocationModel.countDocuments()).toBe(0);
  });

  it('accepts the exact edges of the globe', async () => {
    await trackerLocationService.recordAttendance(USER, 'UTC', {
      ...officeFix,
      lat: -90,
      lng: 180,
      accuracyM: 0,
    });
    expect(await TrackerLocationModel.countDocuments()).toBe(1);
  });
});

describe('recordMove', () => {
  it('refuses a pin when no tracking session is open', async () => {
    await TrackerSessionModel.create({
      userId: USER,
      deviceId: 'd1',
      startedAt: new Date(NOW),
      status: 'stopped',
    });

    await expect(
      codeOf(trackerLocationService.recordMove(USER, 'UTC', northOfOffice(500))),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(await TrackerLocationModel.countDocuments()).toBe(0);
  });

  it('keeps the first pin of the day as a MOVE', async () => {
    await startTracking();

    await expect(trackerLocationService.recordMove(USER, 'UTC', officeFix)).resolves.toBe(true);
    await expect(TrackerLocationModel.findOne().lean()).resolves.toMatchObject({
      kind: 'MOVE',
      day: new Date('2026-01-05T00:00:00Z'),
    });
  });

  it('drops a fix under 200 m from the day’s last pin and keeps one beyond it', async () => {
    await startTracking();
    await trackerLocationService.recordAttendance(USER, 'UTC', officeFix);

    await expect(trackerLocationService.recordMove(USER, 'UTC', northOfOffice(150))).resolves.toBe(
      false,
    );
    await expect(trackerLocationService.recordMove(USER, 'UTC', northOfOffice(250))).resolves.toBe(
      true,
    );

    const kinds = (await TrackerLocationModel.find().sort({ createdAt: 1 }).lean()).map(
      (pin) => pin.kind,
    );
    expect(kinds).toEqual(['ATTENDANCE', 'MOVE']);
  });

  it('compares against the latest pin, not the first', async () => {
    await startTracking();
    await TrackerLocationModel.create([
      { ...officeFix, userId: USER, day: new Date('2026-01-05T00:00:00Z'), kind: 'ATTENDANCE' },
      {
        ...northOfOffice(1000),
        userId: USER,
        day: new Date('2026-01-05T00:00:00Z'),
        kind: 'MOVE',
        capturedAt: new Date('2026-01-05T12:00:00Z'),
      },
    ]);

    // Back at the office: 1 km from the latest pin, though it is where the day began.
    const backAtOffice = { ...officeFix, capturedAt: new Date(NOW) };
    await expect(trackerLocationService.recordMove(USER, 'UTC', backAtOffice)).resolves.toBe(true);
    // Next to the latest pin, now the office again: the same place.
    await expect(
      trackerLocationService.recordMove(USER, 'UTC', {
        ...backAtOffice,
        lat: officeFix.lat + 0.0001,
      }),
    ).resolves.toBe(false);
  });

  it('refuses an invalid fix before looking for a session', async () => {
    const exists = jest.spyOn(TrackerSessionModel, 'exists');
    await expect(
      codeOf(trackerLocationService.recordMove(USER, 'UTC', { ...officeFix, lat: 91 })),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(exists).not.toHaveBeenCalled();
    exists.mockRestore();
  });
});

describe('pinsOn', () => {
  it('answers one person’s pins on one day, oldest first', async () => {
    const day = new Date('2026-01-05T00:00:00Z');
    const pin = (userId: string, pinDay: Date, at: string) => ({
      ...officeFix,
      userId,
      day: pinDay,
      kind: 'MOVE',
      capturedAt: new Date(at),
    });
    await TrackerLocationModel.create([
      pin(USER, day, '2026-01-05T15:00:00Z'),
      pin(USER, day, '2026-01-05T09:00:00Z'),
      pin('someone-else', day, '2026-01-05T10:00:00Z'),
      pin(USER, new Date('2026-01-04T00:00:00Z'), '2026-01-04T10:00:00Z'),
    ]);

    const pins = await trackerLocationService.pinsOn(USER, '2026-01-05');

    expect(pins.map((p) => p.capturedAt.toISOString())).toEqual([
      '2026-01-05T09:00:00.000Z',
      '2026-01-05T15:00:00.000Z',
    ]);
  });

  it.each(['05-01-2026', '2026-1-5', '2026-13-01', ''])('refuses the date %j', (date) => {
    expect(() => trackerLocationService.pinsOn(USER, date)).toThrow(
      'Dates are written YYYY-MM-DD.',
    );
  });
});
