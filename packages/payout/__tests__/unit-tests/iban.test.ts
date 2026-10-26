import { describe, expect, it } from 'vitest';
import { ibanChecksumValid, ibanPrefixFor, ibanProblem, usesIban } from '../../src';

describe('IBAN (ISO 13616)', () => {
  it('accepts registry examples whose check digits are right', () => {
    expect(ibanProblem('DE89370400440532013000', 'DE')).toBeNull();
    expect(ibanProblem('GB82WEST12345698765432', 'GB')).toBeNull();
    expect(ibanProblem('NO9386011117947', 'NO')).toBeNull();
    expect(ibanProblem('SA0380000000608010167519', 'SA')).toBeNull();
  });

  it('catches a single mistyped digit through MOD 97-10', () => {
    expect(ibanChecksumValid('DE89370400440532013000')).toBe(true);
    expect(ibanChecksumValid('DE89370400440532013001')).toBe(false);
    expect(ibanProblem('DE89370400440532013001', 'DE')).toBe(
      'The IBAN’s check digits do not match. Check it for typos.',
    );
  });

  it('refuses the wrong shape, the wrong country and the wrong length', () => {
    expect(ibanProblem('12345', 'DE')).toMatch(/^Enter the IBAN/);
    expect(ibanProblem('GB82WEST12345698765432', 'DE')).toBe(
      'This IBAN is not from the chosen country.',
    );
    expect(ibanProblem('DE8937040044053201300', 'DE')).toBe(
      'This IBAN has the wrong number of characters for its country.',
    );
  });

  it('knows territories that bank under another country’s prefix', () => {
    expect(ibanPrefixFor('RE')).toBe('FR');
    expect(ibanPrefixFor('JE')).toBe('GB');
    expect(ibanProblem('FR1420041010050500013M02606', 'RE')).toBeNull();
    expect(usesIban('IN')).toBe(false);
    expect(ibanPrefixFor('US')).toBeNull();
  });
});
