import { describe, expect, it } from 'vitest';
import { TrackerLocationError } from '../../src/location';
import {
  locationFailureDetail,
  locationFailureOf,
  locationFailureText,
} from '../../src/location-failure';

const english = (source: string): string => source;
const errorOf = (detail: string): string => new TrackerLocationError(detail).message;

describe('locationFailureDetail', () => {
  it('reads the platform’s reason back out of a location error', () => {
    expect(locationFailureDetail(errorOf('Geolocation failed (code 1): User denied'))).toBe(
      'Geolocation failed (code 1): User denied',
    );
  });

  it('is empty when the error carried no reason, or is not a location error', () => {
    expect(locationFailureDetail(errorOf(''))).toBe('');
    expect(locationFailureDetail('Portal unreachable. Reason: network')).toBe('');
  });
});

describe('locationFailureOf', () => {
  it.each([
    ['Geolocation failed (code 1): User denied Geolocation', 'denied'],
    ['Location permission denied', 'denied'],
    ['Geolocation failed (code 2): Position unavailable', 'unavailable'],
    [
      'Current location is unavailable. Make sure that location services are enabled',
      'unavailable',
    ],
    ['Geolocation failed (code 3): Timeout expired', 'timeout'],
    ['Reading the location timed out', 'timeout'],
    ['No tracker window to read the location from', 'unknown'],
  ])('reads “%s” as %s', (detail, failure) => {
    expect(locationFailureOf(errorOf(detail))).toBe(failure);
  });

  it('is unknown when no reason came with the error', () => {
    expect(locationFailureOf(errorOf(''))).toBe('unknown');
  });
});

describe('locationFailureText', () => {
  it('words each failure as a sentence the employee can act on', () => {
    expect(locationFailureText(errorOf('code 1'), english)).toMatch(/not allowed/);
    expect(locationFailureText(errorOf('code 2'), english)).toMatch(/could not work out/);
    expect(locationFailureText(errorOf('code 3'), english)).toMatch(/took too long/);
    expect(locationFailureText(errorOf(''), english)).toBe('Your location could not be read.');
  });

  it('translates through the given translator', () => {
    expect(locationFailureText(errorOf(''), () => 'Position introuvable.')).toBe(
      'Position introuvable.',
    );
  });
});
