import { describe, expect, it } from 'vitest';
import { LIMITS, parseEstimateJson } from '../../src';
import { estimate } from './fixtures';

describe('bare estimate JSON', () => {
  it('accepts a valid estimate', () => {
    const original = estimate();
    const result = parseEstimateJson(JSON.stringify(original));
    expect(result).toEqual({ ok: true, estimate: original });
  });

  it('refuses a payload over the size limit', () => {
    const result = parseEstimateJson(' '.repeat(LIMITS.payloadBytes + 1));
    expect(result.ok === false && result.reason).toBe('too-large');
  });

  it('refuses broken JSON and prototype keys', () => {
    const broken = parseEstimateJson('{');
    expect(broken.ok === false && broken.reason).toBe('syntax');
    const polluted = parseEstimateJson('{"__proto__":{"admin":true}}');
    expect(polluted.ok === false && polluted.reason).toBe('syntax');
  });

  it('refuses an estimate that fails the schema, listing the issues', () => {
    const result = parseEstimateJson(JSON.stringify({ ...estimate(), name: '' }));
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'invalid') {
      expect(result.issues.some((issue) => issue.startsWith('name:'))).toBe(true);
    } else {
      throw new Error('expected an invalid result');
    }
  });
});
