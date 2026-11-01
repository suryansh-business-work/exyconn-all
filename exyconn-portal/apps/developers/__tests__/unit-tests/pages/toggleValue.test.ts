import { describe, expect, it } from 'vitest';
import { toggleValue } from '../../../src/pages/toggleValue';

describe('toggleValue', () => {
  it('adds a value that is missing, at the end', () => {
    expect(toggleValue(['HR'], 'FINANCE')).toEqual(['HR', 'FINANCE']);
  });

  it('removes a value that is there, leaving the rest in order', () => {
    expect(toggleValue(['HR', 'FINANCE', 'CRM'], 'FINANCE')).toEqual(['HR', 'CRM']);
  });

  it('never changes the list it was given', () => {
    const list = ['HR'] as const;
    toggleValue(list, 'HR');
    expect(list).toEqual(['HR']);
  });
});
