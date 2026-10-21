import { inSequence } from '../../../src/utils/inSequence';

const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('inSequence', () => {
  it('resolves an empty list without calling the work', async () => {
    const work = jest.fn();
    await expect(inSequence([], work)).resolves.toEqual([]);
    expect(work).not.toHaveBeenCalled();
  });

  it('returns results in input order and passes each index', async () => {
    const results = await inSequence(['a', 'b', 'c'], (item, index) =>
      Promise.resolve(`${item}${index}`),
    );
    expect(results).toEqual(['a0', 'b1', 'c2']);
  });

  it('starts each step only after the previous one has finished', async () => {
    const events: string[] = [];
    // The first step is the slowest; run in parallel it would finish last.
    await inSequence([30, 10, 0], async (ms) => {
      events.push(`start ${ms}`);
      await tick(ms);
      events.push(`end ${ms}`);
    });
    expect(events).toEqual(['start 30', 'end 30', 'start 10', 'end 10', 'start 0', 'end 0']);
  });

  it('stops at the first rejection and does not run later steps', async () => {
    const seen: number[] = [];
    const run = inSequence([1, 2, 3], (n) => {
      seen.push(n);
      return n === 2 ? Promise.reject(new Error('step 2 failed')) : Promise.resolve(n);
    });
    await expect(run).rejects.toThrow('step 2 failed');
    expect(seen).toEqual([1, 2]);
  });
});
