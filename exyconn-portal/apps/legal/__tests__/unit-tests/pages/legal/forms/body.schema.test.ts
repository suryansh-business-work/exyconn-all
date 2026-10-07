import { describe, expect, it } from 'vitest';
import { legalBody } from '../../../../../src/pages/legal/forms/body.schema';

const TOO_LONG = 'This document is too long to save. Split it into two.';

describe('legalBody', () => {
  it('accepts an empty body, since a draft may have no text yet', () => {
    expect(legalBody.safeParse('').success).toBe(true);
  });

  it('accepts a body right at the server cap', () => {
    expect(legalBody.safeParse('x'.repeat(500_000)).success).toBe(true);
  });

  it('refuses a body one character over the cap, saying how to fix it', () => {
    const result = legalBody.safeParse('x'.repeat(500_001));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(TOO_LONG);
  });

  it('refuses anything that is not text', () => {
    expect(legalBody.safeParse(42).success).toBe(false);
  });
});
