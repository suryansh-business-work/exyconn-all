import { describe, expect, it, vi } from 'vitest';
import { TableBulkAction } from '@/graphql/generated';
import {
  applyBulk,
  BULK_COPY,
  selectedIdsOf,
  type BulkCall,
} from '@/components/data/tableBulkCopy';

function idsUpTo(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `r${index + 1}`);
}

describe('applyBulk', () => {
  it('sends at most 200 ids a request, one after another, and adds up the results', async () => {
    const order: number[] = [];
    const call = vi.fn<BulkCall>(async ({ ids }) => {
      order.push(ids.length);
      return {
        succeeded: ids.length - 1,
        failures: [{ id: String(ids[0]), message: 'In use' }],
      };
    });
    const ids = idsUpTo(450);

    const result = await applyBulk(call, 'listLeadsPaged', ids, TableBulkAction.Archive);

    expect(order).toEqual([200, 200, 50]);
    expect(call).toHaveBeenNthCalledWith(1, {
      list: 'listLeadsPaged',
      ids: ids.slice(0, 200),
      action: TableBulkAction.Archive,
    });
    expect(call).toHaveBeenNthCalledWith(3, {
      list: 'listLeadsPaged',
      ids: ids.slice(400),
      action: TableBulkAction.Archive,
    });
    expect(result).toEqual({
      succeeded: 447,
      failures: [
        { id: 'r1', message: 'In use' },
        { id: 'r201', message: 'In use' },
        { id: 'r401', message: 'In use' },
      ],
    });
  });

  it('sends exactly 200 ids in one request', async () => {
    const call = vi.fn<BulkCall>().mockResolvedValue({ succeeded: 200, failures: [] });
    const result = await applyBulk(call, 'list', idsUpTo(200), TableBulkAction.Delete);
    expect(call).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ succeeded: 200, failures: [] });
  });

  it('stops at the first request that throws', async () => {
    const call = vi
      .fn<BulkCall>()
      .mockResolvedValueOnce({ succeeded: 200, failures: [] })
      .mockRejectedValueOnce(new Error('Forbidden'));

    await expect(applyBulk(call, 'list', idsUpTo(600), TableBulkAction.Delete)).rejects.toThrow(
      'Forbidden',
    );
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('makes no request for an empty selection', async () => {
    const call = vi.fn<BulkCall>();
    expect(await applyBulk(call, 'list', [], TableBulkAction.Restore)).toEqual({
      succeeded: 0,
      failures: [],
    });
    expect(call).not.toHaveBeenCalled();
  });
});

describe('BULK_COPY', () => {
  it('asks before deleting (destructively) and archiving, but restores without asking', () => {
    expect(BULK_COPY[TableBulkAction.Delete].confirm).toMatchObject({
      confirmText: 'Delete',
      destructive: true,
    });
    expect(BULK_COPY[TableBulkAction.Archive].confirm).toMatchObject({
      confirmText: 'Archive',
      destructive: false,
    });
    expect(BULK_COPY[TableBulkAction.Restore].confirm).toBeNull();
    expect(BULK_COPY[TableBulkAction.Restore].done).toBe('{count} rows restored');
  });
});

describe('selectedIdsOf', () => {
  it('reads string and numeric ids and skips rows without one', () => {
    expect(
      selectedIdsOf([{ id: 'a' }, { id: 7 }, { id: null }, { name: 'x' }, null, undefined]),
    ).toEqual(['a', '7']);
  });
});
