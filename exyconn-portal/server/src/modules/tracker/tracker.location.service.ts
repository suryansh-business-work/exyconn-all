import { badRequest } from '../../utils/errors';
import { distanceMetres } from '../../utils/geo';
import { TrackerLocationModel, TrackerSessionModel } from './models';
import {
  LOCATION_MIN_MOVE_METRES,
  type LocationKind,
  type LocationSource,
} from './tracker.constants';
import { zonedDayStartUtc } from './tracker.timezone';

/** One location fix as a tracker app reports it. */
export interface LocationInput {
  lat: number;
  lng: number;
  accuracyM: number;
  source: LocationSource;
  capturedAt: Date;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Refuses a fix that is not a position on the globe, before anything is written. */
function assertLocation(input: LocationInput): void {
  const { lat, lng, accuracyM, capturedAt } = input;
  const valid =
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    Number.isFinite(lng) &&
    Math.abs(lng) <= 180 &&
    Number.isFinite(accuracyM) &&
    accuracyM >= 0 &&
    !Number.isNaN(new Date(capturedAt).getTime());
  if (!valid) {
    badRequest('That location is not a valid position.');
  }
}

/** Midnight UTC of a `YYYY-MM-DD` local date — the key pins and attendance are stored on. */
function dayOf(date: string): Date {
  const day = new Date(`${date}T00:00:00Z`);
  if (!DATE_KEY.test(date) || Number.isNaN(day.getTime())) {
    badRequest('Dates are written YYYY-MM-DD.');
  }
  return day;
}

function save(userId: string, day: Date, kind: LocationKind, input: LocationInput) {
  return TrackerLocationModel.create({
    userId,
    day,
    kind,
    lat: input.lat,
    lng: input.lng,
    accuracyM: input.accuracyM,
    source: input.source,
    capturedAt: input.capturedAt,
  });
}

/**
 * Where an employee was while working: a pin when they mark attendance, and a pin each time
 * they have moved on while a tracking session is open. Every write is the caller's own — the
 * userId comes from the device token, never from the client.
 */
class TrackerLocationService {
  /** The pin taken when the employee marks themselves in, on their current local day. */
  async recordAttendance(userId: string, timezone: string, input: LocationInput): Promise<void> {
    assertLocation(input);
    await save(userId, zonedDayStartUtc(new Date(), timezone), 'ATTENDANCE', input);
  }

  /**
   * A pin while tracking. Kept only when it is at least 200 m from the day's last pin, so a
   * phone sitting on a desk does not fill the map; answers whether it was kept.
   */
  async recordMove(userId: string, timezone: string, input: LocationInput): Promise<boolean> {
    assertLocation(input);
    const tracking = await TrackerSessionModel.exists({ userId, status: 'active' });
    if (!tracking) {
      badRequest('Locations are only recorded while tracking.');
    }
    const day = zonedDayStartUtc(new Date(), timezone);
    const last = await TrackerLocationModel.findOne({ userId, day })
      .sort({ capturedAt: -1 })
      .select('lat lng')
      .lean();
    if (last && distanceMetres(last, input) < LOCATION_MIN_MOVE_METRES) {
      return false;
    }
    await save(userId, day, 'MOVE', input);
    return true;
  }

  /** One person's pins on a local day (`YYYY-MM-DD`), oldest first. */
  pinsOn(userId: string, date: string) {
    return TrackerLocationModel.find({ userId, day: dayOf(date) })
      .sort({ capturedAt: 1 })
      .lean();
  }
}

export const trackerLocationService = new TrackerLocationService();
