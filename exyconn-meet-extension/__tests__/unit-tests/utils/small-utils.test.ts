import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backoffDelay } from '../../../src/utils/backoff';
import {
  base64DecodedLength,
  base64ToBytes,
  base64Url,
  bytesToBase64,
} from '../../../src/utils/base64';
import { chunkArray } from '../../../src/utils/batch';
import { debounce } from '../../../src/utils/debounce';
import { clampPosition, cornerPosition, moveByKey } from '../../../src/utils/floating-position';

describe('backoffDelay', () => {
  const options = { baseMs: 1000, maxMs: 8000 };
  it('doubles per attempt up to the cap', () => {
    expect([1, 2, 3, 4, 5].map((attempt) => backoffDelay(attempt, options))).toEqual([
      1000, 2000, 4000, 8000, 8000,
    ]);
  });
  it('honours a longer server retry-after', () => {
    expect(backoffDelay(1, options, 30_000)).toBe(30_000);
  });
  it('treats attempt 0 like the first', () => {
    expect(backoffDelay(0, options)).toBe(1000);
  });
});

describe('base64', () => {
  it('round-trips every byte value', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, index) => index);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
  it('handles input larger than one slice', () => {
    const big = new Uint8Array(0x8000 * 2 + 3).fill(7);
    expect(base64ToBytes(bytesToBase64(big))).toEqual(big);
  });
  it('makes URL-safe text without padding', () => {
    expect(base64Url(Uint8Array.from([0xfb, 0xff]))).toBe('-_8');
  });
  it('measures the decoded size with two, one or no padding characters', () => {
    for (const length of [1, 2, 3, 6]) {
      const text = bytesToBase64(new Uint8Array(length));
      expect(base64DecodedLength(text)).toBe(length);
    }
  });
});

describe('chunkArray', () => {
  it('slices into batches of at most the size', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkArray([], 50)).toEqual([]);
  });
});

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('collapses a burst into one trailing run', () => {
    const run = vi.fn();
    const debounced = debounce(run, 1000, 3000);
    debounced.schedule();
    vi.advanceTimersByTime(500);
    debounced.schedule();
    vi.advanceTimersByTime(999);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('still runs within the ceiling when changes never stop', () => {
    const run = vi.fn();
    const debounced = debounce(run, 1000, 3000);
    for (let elapsed = 0; elapsed < 3000; elapsed += 500) {
      debounced.schedule();
      vi.advanceTimersByTime(500);
    }
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('drops a pending run when cancelled', () => {
    const run = vi.fn();
    const debounced = debounce(run, 1000, 3000);
    debounced.schedule();
    debounced.cancel();
    debounced.cancel();
    vi.advanceTimersByTime(5000);
    expect(run).not.toHaveBeenCalled();
  });
});

describe('floating position', () => {
  const icon = { width: 100, height: 40 };
  const viewport = { width: 1200, height: 800 };

  it('starts in the chosen corner, above the call controls', () => {
    expect(cornerPosition('bottom-left', icon, viewport)).toEqual({ x: 16, y: 664 });
    expect(cornerPosition('top-right', icon, viewport)).toEqual({ x: 1084, y: 16 });
  });

  it('never lets the icon onto the control bar or off screen', () => {
    expect(clampPosition({ x: -50, y: 790 }, icon, viewport)).toEqual({ x: 16, y: 664 });
    expect(clampPosition({ x: 5000, y: -5 }, icon, viewport)).toEqual({ x: 1084, y: 16 });
    expect(clampPosition({ x: 10, y: 10 }, icon, { width: 50, height: 50 })).toEqual({
      x: 16,
      y: 16,
    });
  });

  it('moves by arrow keys, further with Shift, and ignores other keys', () => {
    const start = { x: 200, y: 200 };
    expect(moveByKey(start, 'ArrowRight', false, icon, viewport)).toEqual({ x: 208, y: 200 });
    expect(moveByKey(start, 'ArrowUp', true, icon, viewport)).toEqual({ x: 200, y: 168 });
    expect(moveByKey(start, 'ArrowLeft', false, icon, viewport)).toEqual({ x: 192, y: 200 });
    expect(moveByKey(start, 'ArrowDown', false, icon, viewport)).toEqual({ x: 200, y: 208 });
    expect(moveByKey(start, 'Enter', false, icon, viewport)).toBeNull();
  });
});

describe('errors', () => {
  it("uses an Error's message and a fallback otherwise", async () => {
    const { errorText, toError } = await import('../../../src/utils/errors');
    expect(errorText(new Error('boom'))).toBe('boom');
    expect(errorText('nope')).toBe('Something went wrong');
    expect(errorText(42, 'Custom')).toBe('Custom');
    const original = new Error('x');
    expect(toError(original)).toBe(original);
    expect(toError('x', 'Could not read')).toEqual(new Error('Could not read'));
  });
});
