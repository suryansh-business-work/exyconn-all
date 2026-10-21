import { describe, expect, it } from 'vitest';
import {
  LOCATION_PURPOSE,
  locationStatusLabel,
  locationStatusSentence,
  locationTurnOn,
  type LocationAccess,
} from '../../src/location-access';
import type { Translate } from '../../src/translate';
import { t } from './translator';

const CHECKING: LocationAccess = { status: 'checking' };
const ON: LocationAccess = { status: 'on' };
const off = (reason: 'denied' | 'servicesOff' | 'noFix', canAsk = false): LocationAccess => ({
  status: 'off',
  reason,
  canAsk,
});

describe('locationStatusLabel', () => {
  it('names each status in a word', () => {
    expect(locationStatusLabel(CHECKING, t)).toBe('Checking…');
    expect(locationStatusLabel(ON, t)).toBe('On');
    expect(locationStatusLabel(off('denied'), t)).toBe('Off');
  });

  it('passes the English through the translator', () => {
    const upper: Translate = (source) => source.toUpperCase();
    expect(locationStatusLabel(ON, upper)).toBe('ON');
  });
});

describe('locationStatusSentence', () => {
  it('says the tracker can read the location when it is on', () => {
    expect(locationStatusSentence(ON, t)).toBe('The tracker can read where you are.');
  });

  it('says it is still checking before the answer is known', () => {
    expect(locationStatusSentence(CHECKING, t)).toBe(
      'Checking whether the tracker can read your location…',
    );
  });

  it('explains why for every off reason', () => {
    expect(locationStatusSentence(off('denied'), t)).toBe(
      'This app is not allowed to use your location.',
    );
    expect(locationStatusSentence(off('servicesOff'), t)).toBe(
      'Location services are turned off on this device.',
    );
    expect(locationStatusSentence(off('noFix'), t)).toMatch(/^No location could be read\./);
  });

  it('translates the reason', () => {
    const french: Translate = (source) =>
      source === 'Location services are turned off on this device.'
        ? 'Services désactivés.'
        : source;
    expect(locationStatusSentence(off('servicesOff'), french)).toBe('Services désactivés.');
  });
});

describe('locationTurnOn', () => {
  it('offers nothing while checking or when location is on', () => {
    expect(locationTurnOn(CHECKING)).toBeNull();
    expect(locationTurnOn(ON)).toBeNull();
  });

  it('offers nothing the app itself cannot switch on', () => {
    expect(locationTurnOn(off('servicesOff', true))).toBeNull();
    expect(locationTurnOn(off('noFix', true))).toBeNull();
  });

  it('asks the OS again while it will still prompt', () => {
    expect(locationTurnOn(off('denied', true))).toBe('request');
  });

  it("opens the app's settings once the OS will no longer prompt", () => {
    expect(locationTurnOn(off('denied', false))).toBe('appSettings');
  });
});

describe('LOCATION_PURPOSE', () => {
  it('is one sentence about attendance and tracking', () => {
    expect(LOCATION_PURPOSE).toMatch(/attendance/);
    expect(LOCATION_PURPOSE).toMatch(/track/);
    expect(LOCATION_PURPOSE).toMatch(/\.$/);
  });
});
