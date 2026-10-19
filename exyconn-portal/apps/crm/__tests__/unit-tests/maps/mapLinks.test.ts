import { describe, expect, it } from 'vitest';
import { addressText, googleMapsLink, positionOf } from '../../../src/maps/mapLinks';

describe('mapLinks', () => {
  it('uses coordinates only when both are numbers, zero included', () => {
    expect(positionOf({ lat: 0, lng: 0 })).toEqual({ lat: 0, lng: 0 });
    expect(positionOf({ lat: 12.9, lng: null })).toBeNull();
    expect(positionOf({})).toBeNull();
  });

  it('joins the known address parts into one trimmed line', () => {
    expect(addressText({ address: ' 1 Main St ', city: 'Pune', country: 'IN' })).toBe(
      '1 Main St, Pune, IN',
    );
    expect(addressText({ address: '  ', city: null, country: 'IN' })).toBe('IN');
    expect(addressText({})).toBe('');
  });

  it('prefers the record own Google Maps page', () => {
    expect(googleMapsLink({ mapUrl: 'https://maps.google.com/?cid=42', lat: 1, lng: 2 })).toBe(
      'https://maps.google.com/?cid=42',
    );
  });

  it('searches the coordinates, else the address', () => {
    expect(googleMapsLink({ lat: 18.52, lng: 73.85 })).toBe(
      'https://www.google.com/maps/search/?api=1&query=18.52%2C73.85',
    );
    expect(googleMapsLink({ address: '1 Main St', city: 'Pune', mapUrl: '' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=1%20Main%20St%2C%20Pune',
    );
  });
});
