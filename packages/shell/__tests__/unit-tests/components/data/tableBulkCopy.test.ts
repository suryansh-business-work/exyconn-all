import { describe, expect, it } from 'vitest';
import { TableBulkAction } from '@/graphql/generated';
import { BULK_COPY, selectedIdsOf } from '@/components/data/tableBulkCopy';

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
    expect(BULK_COPY[TableBulkAction.Delete].confirm?.matchingMessage).toBe(
      'Delete {count} rows matching the current filters? This cannot be undone.',
    );
    expect(BULK_COPY[TableBulkAction.Delete].progress).toBe('Deleting {done} of {total}…');
  });
});

describe('selectedIdsOf', () => {
  it('reads string and numeric ids and skips rows without one', () => {
    expect(
      selectedIdsOf([{ id: 'a' }, { id: 7 }, { id: null }, { name: 'x' }, null, undefined]),
    ).toEqual(['a', '7']);
  });
});
