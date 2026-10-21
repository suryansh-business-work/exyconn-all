import { LOCATION_DETAIL_MARK, isLocationUnavailable } from './location';
import type { Translate } from './translate';

/**
 * Why a location error happened, worded the same on the desktop and the phone. The platform's
 * reason travels in the error message (`TrackerLocationError`); this reads it back.
 */
export type LocationFailure = 'denied' | 'unavailable' | 'timeout' | 'unknown';

/**
 * The platforms' own wording, first match wins. Chromium reports a numbered
 * GeolocationPositionError (1 denied, 2 unavailable, 3 timeout); expo-location words its own.
 */
const FAILURE_PATTERNS: ReadonlyArray<readonly [RegExp, LocationFailure]> = [
  [/code 1\b|denied|not authori[sz]ed|permission/i, 'denied'],
  [/code 3\b|timed? ?out/i, 'timeout'],
  [/code 2\b|unavailable|services|disabled|provider/i, 'unavailable'],
];

const FAILURE_TEXT: Readonly<Record<LocationFailure, string>> = {
  denied:
    'The tracker is not allowed to use your location. Allow it in your device’s location settings, then try again.',
  unavailable:
    'Your device could not work out where it is. Check that location services are on and you are connected to Wi-Fi, then try again.',
  timeout: 'Reading your location took too long. Try again in a moment.',
  unknown: 'Your location could not be read.',
};

/** The platform's own reason in a location error's message; '' when it gave none. */
export function locationFailureDetail(message: string): string {
  if (!isLocationUnavailable(message)) {
    return '';
  }
  const at = message.indexOf(LOCATION_DETAIL_MARK);
  return at === -1 ? '' : message.slice(at + LOCATION_DETAIL_MARK.length).trim();
}

/** Which failure a location error's message describes. */
export function locationFailureOf(message: string): LocationFailure {
  const detail = locationFailureDetail(message);
  return FAILURE_PATTERNS.find(([pattern]) => pattern.test(detail))?.[1] ?? 'unknown';
}

/** The failure in one translated sentence the employee can act on. */
export function locationFailureText(message: string, t: Translate): string {
  return t(FAILURE_TEXT[locationFailureOf(message)]);
}
