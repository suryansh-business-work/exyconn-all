import { describe, expect, it, vi } from 'vitest';
import { InMemoryCache } from '@apollo/client';
import { evictRows } from '@/components/data/evictRows';

describe('evictRows', () => {
  it('evicts every row the cache can identify, skips the rest, and collects garbage', () => {
    const cache = new InMemoryCache();
    const evict = vi.spyOn(cache, 'evict');
    const gc = vi.spyOn(cache, 'gc');

    evictRows(cache, [{ __typename: 'Lead', id: 'l1' }, { id: 'loose' }]);

    expect(evict).toHaveBeenCalledTimes(1);
    expect(evict).toHaveBeenCalledWith({ id: 'Lead:l1' });
    expect(gc).toHaveBeenCalledTimes(1);
  });
});
