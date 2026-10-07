import { describe, expect, it } from 'vitest';
import { TAX_ID_TYPES, taxIdType, taxIdTypesFor } from '../../src';

const codesFor = (country: string): string[] => taxIdTypesFor(country).map((type) => type.code);

describe('TAX_ID_TYPES', () => {
  it('gives every kind of number a unique code', () => {
    const codes = TAX_ID_TYPES.map((type) => type.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('ships an example that passes its own pattern for every kind', () => {
    for (const type of TAX_ID_TYPES) {
      expect(type.pattern.test(type.example), type.code).toBe(true);
    }
  });

  it('lets OTHER belong to no country, so any country may use it', () => {
    expect(taxIdType('OTHER')?.countries).toEqual([]);
  });
});

describe('taxIdType', () => {
  it('returns the kind a known code names', () => {
    const gst = taxIdType('IN_GST');
    expect(gst?.label).toBe('GSTIN');
    expect(gst?.countries).toEqual(['IN']);
  });

  it('returns undefined for an unknown code', () => {
    expect(taxIdType('XX_NOPE')).toBeUndefined();
  });

  it('matches codes exactly, without case folding', () => {
    expect(taxIdType('in_gst')).toBeUndefined();
    expect(taxIdType('')).toBeUndefined();
  });
});

describe('taxIdTypesFor', () => {
  it("lists a country's own kinds followed by OTHER", () => {
    expect(codesFor('IN')).toEqual(['IN_GST', 'OTHER']);
    expect(codesFor('US')).toEqual(['US_EIN', 'OTHER']);
  });

  it('includes every kind a country shares with others', () => {
    expect(codesFor('LI')).toEqual(['CH_UID', 'OTHER']);
    expect(codesFor('DE')).toEqual(['EU_VAT', 'OTHER']);
  });

  it('maps the EL VAT prefix to Greece (GR) as the issuing country', () => {
    expect(codesFor('GR')).toEqual(['EU_VAT', 'OTHER']);
    expect(codesFor('EL')).toEqual(['OTHER']);
  });

  it('offers only OTHER to a country with no listed kinds', () => {
    expect(codesFor('AR')).toEqual(['OTHER']);
  });

  it('offers only OTHER for an empty or lower-case country code', () => {
    expect(codesFor('')).toEqual(['OTHER']);
    expect(codesFor('in')).toEqual(['OTHER']);
  });

  it('keeps the UK outside the EU list', () => {
    expect(codesFor('GB')).toEqual(['GB_VAT', 'OTHER']);
  });
});
