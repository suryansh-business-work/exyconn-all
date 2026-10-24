import { beyondRetention } from '../../../src/utils/retention';

const groups: Record<string, string[]> = { a: ['x'], b: ['x', 'y'], c: [], d: ['z'], e: ['x'] };
const byName = (name: string) => groups[name];

describe('beyondRetention', () => {
  it('keeps everything when the count is 0 or less', () => {
    expect(beyondRetention(['a', 'b'], 0, byName)).toEqual([]);
    expect(beyondRetention(['a', 'b'], -1, byName)).toEqual([]);
  });

  it('lets go of items past the count, but never the newest of a group', () => {
    // a is newest of x, b newest of y, d newest of z; c and e claim nothing new.
    expect(beyondRetention(['a', 'b', 'c', 'd', 'e'], 1, byName)).toEqual(['c', 'e']);
    expect(beyondRetention(['a', 'b', 'c', 'd', 'e'], 4, byName)).toEqual(['e']);
    expect(beyondRetention(['a', 'b'], 5, byName)).toEqual([]);
  });
});
