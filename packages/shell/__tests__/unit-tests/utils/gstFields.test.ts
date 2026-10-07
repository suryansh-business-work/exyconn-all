import { describe, expect, it } from 'vitest';
import { gstinField, gstStateCodeField } from '@/utils/gstFields';

describe('gstinField', () => {
  it('accepts a valid GSTIN, trimming and upper-casing it first', () => {
    expect(gstinField.parse(' 27aapfu0939f1zv ')).toBe('27AAPFU0939F1ZV');
  });

  it('accepts blank for a party with no registration', () => {
    expect(gstinField.parse('')).toBe('');
  });

  it('rejects a number with the wrong shape', () => {
    const result = gstinField.safeParse('27AAPFU0939F1Z');
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('Enter a valid 15-character GSTIN');
  });
});

describe('gstStateCodeField', () => {
  it('accepts a two-digit code or blank', () => {
    expect(gstStateCodeField.parse('27')).toBe('27');
    expect(gstStateCodeField.parse('')).toBe('');
  });

  it('rejects anything else with "Pick a state"', () => {
    for (const value of ['7', '277', 'MH']) {
      const result = gstStateCodeField.safeParse(value);
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.error?.issues)).toContain('Pick a state');
    }
  });
});
