import { describe, expect, it } from 'vitest';
import { initials } from '../../src/format';

describe('initials', () => {
  it('takes the first and last names', () => {
    expect(initials('Asha Rao')).toBe('AR');
    expect(initials('  maria del carmen  lopez ')).toBe('ML');
  });

  it('takes one letter from a single name, and a ? from none', () => {
    expect(initials('Prince')).toBe('P');
    expect(initials('   ')).toBe('?');
  });
});
