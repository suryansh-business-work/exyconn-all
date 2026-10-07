import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUT_ERRORS, parseInput } from '../../../src/engine/inputs';
import { INPUT_KINDS } from '../../../src/schema';
import { NOW } from './fixtures';

const opts = { now: NOW };

describe('parseInput', () => {
  it('has a default error for every input kind', () => {
    expect(Object.keys(DEFAULT_INPUT_ERRORS).sort((a, b) => a.localeCompare(b))).toEqual(
      [...INPUT_KINDS].sort((a, b) => a.localeCompare(b)),
    );
  });

  it('reads names', () => {
    expect(parseInput('name', '  Asha Rao ', opts)).toBe('Asha Rao');
    expect(parseInput('name', 'R2D2', opts)).toBeNull();
  });

  it('lower-cases emails and rejects malformed ones', () => {
    expect(parseInput('email', ' Asha@Example.COM ', opts)).toBe('asha@example.com');
    expect(parseInput('email', 'asha@', opts)).toBeNull();
  });

  it('reads PIN codes', () => {
    expect(parseInput('pincode', '560034', opts)).toBe('560034');
    expect(parseInput('pincode', '060034', opts)).toBeNull();
  });

  it('reads numbers but not blanks or words', () => {
    expect(parseInput('number', ' 32000 ', opts)).toBe('32000');
    expect(parseInput('number', '   ', opts)).toBeNull();
    expect(parseInput('number', 'lots', opts)).toBeNull();
  });

  it('wants at least two characters of text', () => {
    expect(parseInput('text', 'ok', opts)).toBe('ok');
    expect(parseInput('text', ' a ', opts)).toBeNull();
  });

  describe('phone', () => {
    it('formats an Indian mobile, with or without the country code', () => {
      expect(parseInput('phone', '98765 43210', opts)).toBe('+91 98765 43210');
      expect(parseInput('phone', '+91-98765-43210', opts)).toBe('+91 98765 43210');
    });

    it('keeps another valid phone number as typed', () => {
      expect(parseInput('phone', ' +44 20 7946 0958 ', opts)).toBe('+44 20 7946 0958');
    });

    it('rejects something that is not a phone number', () => {
      expect(parseInput('phone', 'call me', opts)).toBeNull();
    });
  });

  describe('date', () => {
    it('normalises a day/month/year date', () => {
      expect(parseInput('date', ' 4-8-1990 ', opts)).toBe('04/08/1990');
      expect(parseInput('date', '14/08/2030', opts)).toBe('14/08/2030');
    });

    it('rejects a wrong shape, an impossible date and years before 1900', () => {
      expect(parseInput('date', '1990-08-14', opts)).toBeNull();
      expect(parseInput('date', '31/02/2020', opts)).toBeNull();
      expect(parseInput('date', '01/01/1899', opts)).toBeNull();
    });

    it('rejects a future date only when it must be in the past', () => {
      expect(parseInput('date', '08/10/2026', { now: NOW, past: true })).toBeNull();
      expect(parseInput('date', '07/10/2026', { now: NOW, past: true })).toBe('07/10/2026');
      expect(parseInput('date', '08/10/2026', { now: NOW, past: false })).toBe('08/10/2026');
    });
  });
});
