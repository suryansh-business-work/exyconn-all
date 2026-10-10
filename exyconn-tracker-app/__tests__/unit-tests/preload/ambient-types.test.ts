import { describe, expect, it } from 'vitest';

describe('preload ambient declaration', () => {
  it('stays type-only: loading it exports nothing at runtime', async () => {
    const declaration = await import('../../../src/preload/index.d');

    expect(Object.keys(declaration)).toEqual([]);
  });
});
