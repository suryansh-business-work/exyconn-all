import type { LatLng } from './location';
import { formatTimeOfDay } from './time';
import type { Translate } from './translate';
import type { LocationSource, TrackerLocationPin } from './types';

/**
 * The embeddable Google map of one point, zoomed to street level. The only map URL either app
 * builds: the desktop renderer CSP's frame-src allows exactly this host (and www.google.com,
 * where it redirects), so a second, different map URL would simply be blocked.
 */
export function mapEmbedUrl({ lat, lng }: Readonly<LatLng>): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}

/** What each pin is, as English catalogue keys. */
const KIND_LABELS: Readonly<Record<TrackerLocationPin['kind'], string>> = {
  ATTENDANCE: 'Attendance',
  MOVE: 'Moved',
};

/** Where the fix came from: a phone's GPS, or a computer's location service. */
const SOURCE_LABELS: Readonly<Record<LocationSource, string>> = {
  GPS: 'GPS',
  SYSTEM: 'System',
};

/** One pin's words, translated: when it was taken, what it is, and where the fix came from. */
export interface LocationPinParts {
  time: string;
  kind: string;
  source: string;
}

/** The parts of a pin's row, in the employee's zone; both apps lay them out the same way. */
export function locationPinParts(
  pin: Pick<TrackerLocationPin, 'kind' | 'source' | 'capturedAt'>,
  zone: string,
  t: Translate,
): LocationPinParts {
  return {
    time: formatTimeOfDay(pin.capturedAt, zone),
    kind: t(KIND_LABELS[pin.kind]),
    source: t(SOURCE_LABELS[pin.source]),
  };
}

/** "09:12 · Attendance · GPS" — a pin's row line, and the map's description when it is opened. */
export function locationPinLine(
  pin: Pick<TrackerLocationPin, 'kind' | 'source' | 'capturedAt'>,
  zone: string,
  t: Translate,
): string {
  return t('{time} · {kind} · {source}', { ...locationPinParts(pin, zone, t) });
}
