import { describe, it, expect } from 'vitest';
import { MAX_CAPTURE_BYTES, needsFallback } from './capture-policy';

describe('needsFallback', () => {
  it('keeps a lossless capture that fits', () => {
    expect(needsFallback(true, 4 * 1024 * 1024)).toBe(false);
    expect(needsFallback(true, MAX_CAPTURE_BYTES)).toBe(false);
  });

  it('gives up lossless — never resolution — when a capture is too big to send', () => {
    // The portal refuses an oversized upload with BAD_USER_INPUT, which the outbox treats as
    // permanent and drops. That is how quality 100 came to produce no screenshots at all.
    expect(needsFallback(true, MAX_CAPTURE_BYTES + 1)).toBe(true);
  });

  it('never second-guesses a JPEG, which is already inside the budget by construction', () => {
    expect(needsFallback(false, MAX_CAPTURE_BYTES * 10)).toBe(false);
  });

  it('stays under the portal ceiling, so the app never builds what the server refuses', () => {
    // Mirrors TRACKER_LIMITS.maxScreenshotBytes on the server (24MB).
    expect(MAX_CAPTURE_BYTES).toBeLessThan(24 * 1024 * 1024);
  });
});
