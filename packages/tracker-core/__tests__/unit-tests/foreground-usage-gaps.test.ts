import { describe, expect, it } from 'vitest';
import { ForegroundUsage } from '../../src/foreground-usage';

describe('ForegroundUsage zero-length observations', () => {
  it('credits nothing for two observations at the same instant', () => {
    const usage = new ForegroundUsage();
    usage.observe(1000, 'Editor', 'a.ts');
    usage.observe(1000, 'Browser', 'Docs');

    expect(usage.drain(1000, true)).toEqual([]);
  });

  it('credits nothing when the clock steps backwards', () => {
    const usage = new ForegroundUsage();
    usage.observe(5000, 'Editor', 'a.ts');

    expect(usage.drain(4000, true)).toEqual([]);
  });
});
