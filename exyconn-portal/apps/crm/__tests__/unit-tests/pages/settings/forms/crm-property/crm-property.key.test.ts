import { describe, expect, it } from 'vitest';
import { keyFromLabel } from '../../../../../../src/pages/settings/forms/crm-property';

describe('keyFromLabel', () => {
  it('lowercases the label and joins its words with single underscores', () => {
    expect(keyFromLabel('Lead score (0-100)')).toBe('lead_score_0_100');
    expect(keyFromLabel('Account  --  Manager')).toBe('account_manager');
  });

  it('starts with a letter, dropping leading digits and separators', () => {
    expect(keyFromLabel('2nd contact')).toBe('nd_contact');
    expect(keyFromLabel('  _-Region')).toBe('region');
  });

  it('drops characters that are neither letters, digits nor separators', () => {
    expect(keyFromLabel('Café & Bar!')).toBe('caf_bar');
  });

  it('never ends with an underscore', () => {
    expect(keyFromLabel('Score -')).toBe('score');
  });

  it('is empty when the label has no letter to start from', () => {
    expect(keyFromLabel('')).toBe('');
    expect(keyFromLabel('123 - 456')).toBe('');
  });

  it('cuts the key at 40 characters without leaving an underscore at the cut', () => {
    const long = keyFromLabel(`${'a'.repeat(39)} b`);
    expect(long).toBe('a'.repeat(39));

    const exact = keyFromLabel('b'.repeat(45));
    expect(exact).toHaveLength(40);
  });
});
