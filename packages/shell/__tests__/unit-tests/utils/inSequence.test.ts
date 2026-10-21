import { describe, expect, it, vi } from 'vitest';
import { inSequence } from '@/utils/inSequence';

describe('inSequence', () => {
  it('runs each step only after the one before has finished, and keeps the order', async () => {
    const log: string[] = [];
    const step = async (item: string, index: number) => {
      log.push(`start ${item}`);
      await new Promise((resolve) => setTimeout(resolve, item === 'a' ? 10 : 0));
      log.push(`end ${item}`);
      return `${item}${index}`;
    };

    await expect(inSequence(['a', 'b'], step)).resolves.toEqual(['a0', 'b1']);
    expect(log).toEqual(['start a', 'end a', 'start b', 'end b']);
  });

  it('resolves to nothing for no items, without calling the step', async () => {
    const step = vi.fn();
    await expect(inSequence([], step)).resolves.toEqual([]);
    expect(step).not.toHaveBeenCalled();
  });

  it('stops at the first failure and rejects with its error', async () => {
    const step = vi.fn((item: number) =>
      item === 2 ? Promise.reject(new Error('Item 2 failed')) : Promise.resolve(item),
    );

    await expect(inSequence([1, 2, 3], step)).rejects.toThrow('Item 2 failed');
    expect(step).toHaveBeenCalledTimes(2);
  });
});
