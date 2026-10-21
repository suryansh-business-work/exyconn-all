import type { Translate } from './translate';

/**
 * Whether this device can tell the tracker where it is, worded the same on the desktop and
 * the phone. Each platform finds the answer its own way — the desktop reads a fix, the phone
 * asks expo-location — and both show it with these words and offer the same actions.
 */

/** Why no location can be read. */
export type LocationOffReason =
  /** The employee (or the OS) refused this app location access. */
  | 'denied'
  /** The device's location services are switched off altogether. */
  | 'servicesOff'
  /** A fix was asked for and none came back; the OS did not say why. */
  | 'noFix';

export type LocationAccess =
  | { status: 'checking' }
  | { status: 'on' }
  /** `canAsk`: the OS will still show its own permission prompt if asked. */
  | { status: 'off'; reason: LocationOffReason; canAsk: boolean };

/** What "Turn on" does: show the OS prompt, or open this app's settings page instead. */
export type LocationTurnOn = 'request' | 'appSettings';

/** Why the tracker asks for location, as one sentence. */
export const LOCATION_PURPOSE =
  'Your location is pinned when you mark attendance, and checked while you track so your workspace knows where you are working from.';

const STATUS_LABELS: Readonly<Record<LocationAccess['status'], string>> = {
  checking: 'Checking…',
  on: 'On',
  off: 'Off',
};

const OFF_REASONS: Readonly<Record<LocationOffReason, string>> = {
  denied: 'This app is not allowed to use your location.',
  servicesOff: 'Location services are turned off on this device.',
  noFix:
    'No location could be read. Location services may be off, or this app may not be allowed to use them.',
};

const ON_SENTENCE = 'The tracker can read where you are.';
const CHECKING_SENTENCE = 'Checking whether the tracker can read your location…';

/** The short status ("On", "Off"), translated. */
export function locationStatusLabel(access: LocationAccess, t: Translate): string {
  return t(STATUS_LABELS[access.status]);
}

/** The status in a sentence — for "off", why — translated. */
export function locationStatusSentence(access: LocationAccess, t: Translate): string {
  if (access.status === 'off') {
    return t(OFF_REASONS[access.reason]);
  }
  return t(access.status === 'on' ? ON_SENTENCE : CHECKING_SENTENCE);
}

/**
 * Whether to offer "Turn on", and what it does. Only a refused permission can be turned on
 * from the app; services switched off, or a fix that never came, need the OS settings page.
 */
export function locationTurnOn(access: LocationAccess): LocationTurnOn | null {
  if (access.status !== 'off' || access.reason !== 'denied') {
    return null;
  }
  return access.canAsk ? 'request' : 'appSettings';
}
