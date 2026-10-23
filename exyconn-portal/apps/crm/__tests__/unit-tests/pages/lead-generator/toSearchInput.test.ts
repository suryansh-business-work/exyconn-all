import { describe, expect, it } from 'vitest';
import { toSearchInput } from '../../../../src/pages/lead-generator/toSearchInput';
import type { LeadSearchValues } from '../../../../src/pages/lead-generator/forms/lead-search';
import { corners } from './search-area-fake';

const values = (overrides: Partial<LeadSearchValues>): LeadSearchValues => ({
  query: 'dentists',
  mode: 'place',
  location: 'Pune, India',
  radiusKm: 5,
  centre: 'map',
  lat: '',
  lng: '',
  area: [],
  ...overrides,
});

const CENTRE = { lat: 18.52, lng: 73.85 };

describe('toSearchInput', () => {
  it('searches the place typed', () => {
    expect(toSearchInput(values({}), CENTRE)).toEqual({
      query: 'dentists',
      location: 'Pune, India',
    });
  });

  it('searches inside the drawn area', () => {
    expect(toSearchInput(values({ mode: 'area', area: corners(3) }), null)).toEqual({
      query: 'dentists',
      polygon: corners(3),
    });
  });

  it('searches a radius around the map centre, in whole metres', () => {
    expect(toSearchInput(values({ mode: 'map', radiusKm: 1.2345 }), CENTRE)).toEqual({
      query: 'dentists',
      lat: 18.52,
      lng: 73.85,
      radiusMeters: 1235,
    });
  });

  it('searches a radius around typed coordinates or the reader, not the map centre', () => {
    const typed = values({ mode: 'map', centre: 'coords', lat: '12.5', lng: '77.25' });
    expect(toSearchInput(typed, CENTRE)).toEqual({
      query: 'dentists',
      lat: 12.5,
      lng: 77.25,
      radiusMeters: 5000,
    });
  });

  it('falls back to the place typed while the map has no centre', () => {
    expect(toSearchInput(values({ mode: 'map' }), null)).toEqual({
      query: 'dentists',
      location: 'Pune, India',
    });
  });
});
