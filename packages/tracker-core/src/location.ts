import type { TrackerLocationInput } from './types';

/**
 * Where the employee works from, the same way on the desktop and the phone: a pin when they
 * mark attendance, then a check every five minutes while tracking that sends a pin only once
 * they have moved on. Each platform supplies only how to read a fix (`LocationProvider`).
 */

/** How often a tracking app checks where it is. */
export const LOCATION_POLL_MS = 5 * 60_000;

/** A fix closer than this to the last pin sent is the same place, and is not sent again. */
export const LOCATION_MIN_MOVE_METRES = 200;

/**
 * The sentence shown when no fix could be read — almost always location access switched off.
 * Shown through the UI's translator, which is keyed on this English.
 */
export const LOCATION_UNAVAILABLE_MESSAGE =
  'Location access is off. Turn it on so the tracker can record where you are working.';

/**
 * Whether a refused command's message is the location one. The desktop's errors cross IPC as
 * text, so the sentence itself is the signal; the phone passes `messageOf(cause, …)`.
 */
export function isLocationUnavailable(message: string): boolean {
  return message === LOCATION_UNAVAILABLE_MESSAGE;
}

/** How a platform reads where the device is. Rejects when location access is off. */
export interface LocationProvider {
  current(): Promise<TrackerLocationInput>;
}

/** No fix could be read. The message is `LOCATION_UNAVAILABLE_MESSAGE`, for the UI to translate. */
export class TrackerLocationError extends Error {
  constructor() {
    super(LOCATION_UNAVAILABLE_MESSAGE);
    this.name = 'TrackerLocationError';
  }
}

/** A point on the globe, in degrees. */
export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_METRES = 6_371_000;

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

/** The great-circle (haversine) distance between two points, in metres. */
export function distanceMetres(a: LatLng, b: LatLng): number {
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Whether a new fix is worth a pin: the first of the day, or far enough from the last one. */
export function shouldSendPin(
  last: LatLng | null,
  next: LatLng,
  minMeters: number = LOCATION_MIN_MOVE_METRES,
): boolean {
  return last === null || distanceMetres(last, next) >= minMeters;
}

/** Reads a fix, turning any platform failure into one error the UI can explain. */
export async function readLocation(provider: LocationProvider): Promise<TrackerLocationInput> {
  try {
    return await provider.current();
  } catch (error) {
    // The platform's reason is logged; never a coordinate, which this path has none of anyway.
    console.error('Reading the device location failed', error);
    throw new TrackerLocationError();
  }
}

/**
 * The five-minute check while tracking. Sends a MOVE pin only when `shouldSendPin` says the
 * employee has moved on from the last pin; a failure is logged and the next check tries again.
 */
export class LocationPoller {
  private timer: ReturnType<typeof setInterval> | null = null;
  private last: LatLng | null = null;

  constructor(
    private readonly provider: LocationProvider,
    private readonly send: (location: TrackerLocationInput) => Promise<unknown>,
  ) {}

  /** Records a pin sent another way (the attendance pin), so the next move is measured from it. */
  remember(pin: LatLng): void {
    this.last = { lat: pin.lat, lng: pin.lng };
  }

  start(): void {
    this.stop();
    this.timer = setInterval(() => {
      this.check().catch((error: unknown) => console.error('Recording a location failed', error));
    }, LOCATION_POLL_MS);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Stops and forgets the last pin — it belonged to the employee who signed out. */
  reset(): void {
    this.stop();
    this.last = null;
  }

  private async check(): Promise<void> {
    const next = await readLocation(this.provider);
    if (!shouldSendPin(this.last, next)) {
      return;
    }
    await this.send(next);
    this.remember(next);
  }
}
