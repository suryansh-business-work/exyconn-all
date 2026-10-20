import { afterEach, describe, expect, it, vi } from 'vitest';
import { FAIR_SCORE_COLOR, GOOD_SCORE_COLOR, POOR_SCORE_COLOR, getScoreColor } from '../../shared/utils/scoreColor';
import { toText } from '../../shared/utils/toText';
import { withUniqueKeys } from '../../shared/utils/uniqueKeys';
import { copyText } from '../../shared/utils/clipboard';
import { logFailure } from '../../shared/utils/logFailure';
import { forEachInSequence } from '../../shared/utils/sequence';

describe('getScoreColor', () => {
  it('is green from 70, amber from 40, red below', () => {
    expect(getScoreColor(100)).toBe(GOOD_SCORE_COLOR);
    expect(getScoreColor(70)).toBe(GOOD_SCORE_COLOR);
    expect(getScoreColor(69.9)).toBe(FAIR_SCORE_COLOR);
    expect(getScoreColor(40)).toBe(FAIR_SCORE_COLOR);
    expect(getScoreColor(39.9)).toBe(POOR_SCORE_COLOR);
    expect(getScoreColor(0)).toBe(POOR_SCORE_COLOR);
  });
});

describe('toText', () => {
  it('keeps strings and writes scalars as they are', () => {
    expect(toText('hello')).toBe('hello');
    expect(toText(42)).toBe('42');
    expect(toText(false)).toBe('false');
    expect(toText(10n)).toBe('10');
    expect(toText(null)).toBe('null');
    expect(toText(undefined)).toBe('undefined');
  });

  it('serialises structures instead of printing [object Object]', () => {
    expect(toText({ a: [1, 2] })).toBe('{"a":[1,2]}');
    expect(toText([1, 'x'])).toBe('[1,"x"]');
  });

  it('gives an empty string for values JSON cannot represent', () => {
    expect(toText(() => 1)).toBe('');
    expect(toText(Symbol('s'))).toBe('');
  });
});

describe('withUniqueKeys', () => {
  it('numbers repeated content so that every key is unique and stable', () => {
    const keyed = withUniqueKeys(['a', 'b', 'a', 'a'], (item) => item);
    expect(keyed.map((entry) => entry.key)).toEqual(['a#1', 'b#1', 'a#2', 'a#3']);
    expect(keyed.map((entry) => entry.item)).toEqual(['a', 'b', 'a', 'a']);
  });

  it('keys by the derived content, not the item identity', () => {
    const keyed = withUniqueKeys([{ id: 1 }, { id: 1 }], (item) => `id-${item.id}`);
    expect(keyed.map((entry) => entry.key)).toEqual(['id-1#1', 'id-1#2']);
  });

  it('returns nothing for nothing', () => {
    expect(withUniqueKeys([], String)).toEqual([]);
  });
});

describe('copyText', () => {
  afterEach(() => vi.restoreAllMocks());

  it('writes the text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    copyText('hello');
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('logs a refused copy instead of throwing', async () => {
    const denied = new Error('denied');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(denied) },
      configurable: true,
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => copyText('hello')).not.toThrow();

    await vi.waitFor(() => expect(consoleError).toHaveBeenCalledWith('Copy to clipboard failed', denied));
  });
});

describe('logFailure', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs the context with the error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('boom');

    logFailure('Upload failed')(error);

    expect(consoleError).toHaveBeenCalledWith('Upload failed', error);
  });
});

describe('forEachInSequence', () => {
  it('starts each step only after the previous one settled, in order, with its index', async () => {
    const events: string[] = [];
    const step = async (item: string, index: number) => {
      events.push(`start ${item}${index}`);
      await new Promise((resolve) => setTimeout(resolve, item === 'a' ? 20 : 0));
      events.push(`end ${item}${index}`);
    };

    await forEachInSequence(['a', 'b'], step);

    expect(events).toEqual(['start a0', 'end a0', 'start b1', 'end b1']);
  });

  it('stops at the first rejection', async () => {
    const seen: number[] = [];
    const run = forEachInSequence([1, 2, 3], async (n) => {
      seen.push(n);
      if (n === 2) throw new Error('stop');
    });

    await expect(run).rejects.toThrow('stop');
    expect(seen).toEqual([1, 2]);
  });

  it('resolves at once for no items', async () => {
    await expect(forEachInSequence([], () => Promise.reject(new Error('never')))).resolves.toBeUndefined();
  });
});
