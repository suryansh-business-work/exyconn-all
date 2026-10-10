import { describe, expect, it } from 'vitest';
import { FAIR_SCORE_COLOR, GOOD_SCORE_COLOR, POOR_SCORE_COLOR, getScoreColor } from '../../shared/utils/scoreColor';
import { toText } from '../../shared/utils/toText';
import { withUniqueKeys } from '../../shared/utils/uniqueKeys';

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
