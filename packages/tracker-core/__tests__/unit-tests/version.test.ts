import { describe, expect, it } from 'vitest';
import { isNewerVersion } from '../../src/version';

describe('isNewerVersion', () => {
  it.each([
    ['1.9.9', '1.9.8', true],
    ['1.10.0', '1.9.8', true],
    ['2.0.0', '1.99.99', true],
    ['v1.9.9', '1.9.8', true],
    ['1.9.8', '1.9.8', false],
    ['1.9.7', '1.9.8', false],
    ['1.10', '1.9.8', false],
    ['', '1.9.8', false],
  ])('%s over %s is %s', (candidate, current, expected) => {
    expect(isNewerVersion(candidate, current)).toBe(expected);
  });
});
