import { describe, expect, it } from 'vitest';
import { countryName, isValidCountry } from '../../src/iso';

describe('isValidCountry', () => {
  it('accepts an ISO 3166-1 alpha-2 code', () => {
    expect(isValidCountry('IN')).toBe(true);
    expect(isValidCountry('DE')).toBe(true);
  });

  it('refuses unassigned, lower-case and malformed codes', () => {
    expect(isValidCountry('XX')).toBe(false);
    expect(isValidCountry('in')).toBe(false);
    expect(isValidCountry('IND')).toBe(false);
    expect(isValidCountry('')).toBe(false);
  });
});

describe('countryName', () => {
  it('names a country in the language asked for', () => {
    expect(countryName('DE', 'en')).toBe('Germany');
    expect(countryName('DE', 'de')).toBe('Deutschland');
  });
});
