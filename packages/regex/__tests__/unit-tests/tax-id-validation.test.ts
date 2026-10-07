import { describe, expect, it } from 'vitest';
import { isValidTaxId, normalizeTaxId } from '../../src';

describe('normalizeTaxId', () => {
  it('removes every kind of whitespace and upper-cases letters', () => {
    expect(normalizeTaxId(' de 123\t456\n789 ')).toBe('DE123456789');
  });

  it('keeps punctuation the patterns allow', () => {
    expect(normalizeTaxId('12-3456789')).toBe('12-3456789');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeTaxId('   ')).toBe('');
    expect(normalizeTaxId('')).toBe('');
  });
});

describe('isValidTaxId', () => {
  it('accepts well-formed numbers of a known kind', () => {
    expect(isValidTaxId('IN_GST', '27AAPFU0939F1ZV')).toBe(true);
    expect(isValidTaxId('US_EIN', '123456789')).toBe(true);
    expect(isValidTaxId('CA_BN', '123456789')).toBe(true);
    expect(isValidTaxId('JP_CN', '1234567890123')).toBe(true);
  });

  it('normalises spaces and case before checking', () => {
    expect(isValidTaxId('IN_GST', '27 aapfu 0939 f1zv')).toBe(true);
    expect(isValidTaxId('GB_VAT', 'gb 123 4567 89')).toBe(true);
    expect(isValidTaxId('CH_UID', 'che 123 456 789 mwst')).toBe(true);
  });

  it('turns away malformed numbers', () => {
    expect(isValidTaxId('IN_GST', '27AAPFU0939F1AV')).toBe(false);
    expect(isValidTaxId('US_EIN', '12-345678')).toBe(false);
    expect(isValidTaxId('SA_VAT', '310123456700004')).toBe(false);
    expect(isValidTaxId('ZA_VAT', '5123456789')).toBe(false);
  });

  it('checks EU VAT numbers by their EL prefix for Greece, not GR', () => {
    expect(isValidTaxId('EU_VAT', 'EL123456789')).toBe(true);
    expect(isValidTaxId('EU_VAT', 'GR123456789')).toBe(false);
  });

  it('enforces length limits at the boundaries', () => {
    expect(isValidTaxId('NZ_GST', '12345678')).toBe(true);
    expect(isValidTaxId('NZ_GST', '1234567')).toBe(false);
    expect(isValidTaxId('NZ_GST', '1234567890')).toBe(false);
    expect(isValidTaxId('EU_VAT', 'DE12')).toBe(true);
    expect(isValidTaxId('EU_VAT', 'DE1')).toBe(false);
  });

  it('applies a loose shape to OTHER', () => {
    expect(isValidTaxId('OTHER', 'ab-123456')).toBe(true);
    expect(isValidTaxId('OTHER', 'AB')).toBe(false);
    expect(isValidTaxId('OTHER', '-AB123')).toBe(false);
  });

  it('rejects any value for an unknown code', () => {
    expect(isValidTaxId('XX_NOPE', '27AAPFU0939F1ZV')).toBe(false);
  });

  it('rejects a blank value', () => {
    expect(isValidTaxId('IN_GST', '   ')).toBe(false);
  });
});
