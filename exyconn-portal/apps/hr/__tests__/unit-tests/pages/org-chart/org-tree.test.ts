import { describe, expect, it } from 'vitest';
import { initialsOf } from '../../../../src/pages/org-chart/org-tree';

describe('initialsOf', () => {
  it('takes the first letter of the first two names, upper-cased', () => {
    expect(initialsOf('asha rao')).toBe('AR');
    expect(initialsOf('Maya Devi Iyer')).toBe('MD');
  });

  it('uses the one initial of a single name', () => {
    expect(initialsOf('Omar')).toBe('O');
  });
});
