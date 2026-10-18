import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TableBulkAction,
  useTableBulkActionMutation,
  type TableQueryInput,
} from '@/graphql/generated';
import type { TablePageResult } from '@/components/data/ServerDataGrid.types';
import { useBulkRun } from '@/components/data/useBulkRun';
import type { TableBulk } from '@/components/data/useTableBulk';
import { portalLogger } from '@/logging/portalLogger';

const { confirm, notify } = vi.hoisted(() => ({ confirm: vi.fn(), notify: vi.fn() }));

vi.mock('@/components/feedback/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/components/feedback/NotificationProvider', () => ({ useNotify: () => notify }));
vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useTableBulkActionMutation: vi.fn(),
}));

const mutate = vi.fn();

type Fetch = (input: TableQueryInput) => Promise<TablePageResult<unknown>>;

const MATCHING_QUERY = { search: 'acme', sort: null, sorts: [], filters: [] };

function makeBulk(patch: Partial<TableBulk> = {}): TableBulk {
  return {
    list: 'listLeadsPaged',
    fetchRows: vi.fn<Fetch>(),
    selectedIds: ['l1', 'l2'],
    deletable: true,
    archivable: true,
    enabled: true,
    selectedCount: 2,
    busy: false,
    setBusy: vi.fn(),
    reload: vi.fn(),
    onDone: vi.fn(),
    archived: false,
    archivedRef: { current: false },
    setArchived: vi.fn(),
    onSelectionChanged: vi.fn(),
    clearSelection: vi.fn(),
    selectPage: vi.fn(),
    matching: null,
    setMatching: vi.fn(),
    allMatching: false,
    selectAllMatching: vi.fn(),
    progress: null,
    setProgress: vi.fn(),
    ...patch,
  };
}

function runFor(bulk: TableBulk) {
  return renderHook(() => useBulkRun(bulk)).result.current;
}

function answered(succeeded: number, failures: { id: string; message: string }[] = []) {
  return { data: { tableBulkAction: { succeeded, failures } } };
}

beforeEach(() => {
  confirm.mockReset();
  notify.mockReset();
  mutate.mockReset();
  vi.mocked(useTableBulkActionMutation).mockReturnValue([mutate] as unknown as ReturnType<
    typeof useTableBulkActionMutation
  >);
});

describe('useBulkRun', () => {
  it('confirms a delete, sends the ids, reports, then re-reads the grid and tells the host', async () => {
    confirm.mockResolvedValue(true);
    mutate.mockResolvedValue(answered(2));
    const bulk = makeBulk();

    await runFor(bulk)(TableBulkAction.Delete);

    expect(confirm).toHaveBeenCalledWith({
      message: 'Delete {count} selected rows? This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      messageValues: { count: '2' },
    });
    expect(mutate).toHaveBeenCalledWith({
      variables: { list: 'listLeadsPaged', ids: ['l1', 'l2'], action: TableBulkAction.Delete },
    });
    expect(bulk.setBusy).toHaveBeenNthCalledWith(1, true);
    expect(bulk.setBusy).toHaveBeenLastCalledWith(false);
    expect(bulk.setProgress).toHaveBeenNthCalledWith(1, {
      label: 'Deleting… {done} of {total}',
      done: 2,
      total: 2,
    });
    expect(bulk.setProgress).toHaveBeenLastCalledWith(null);
    expect(notify).toHaveBeenCalledWith('{count} rows deleted', 'success', { count: 2 });
    expect(bulk.clearSelection).toHaveBeenCalledTimes(1);
    expect(bulk.reload).toHaveBeenCalledTimes(1);
    expect(bulk.onDone).toHaveBeenCalledTimes(1);
  });

  it('restores without asking, on a grid whose host wants no word back', async () => {
    mutate.mockResolvedValue(answered(2));
    const bulk = makeBulk({ onDone: undefined });

    await runFor(bulk)(TableBulkAction.Restore);

    expect(confirm).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('{count} rows restored', 'success', { count: 2 });
    expect(bulk.reload).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the person cancels the confirm', async () => {
    confirm.mockResolvedValue(false);
    const bulk = makeBulk();

    await runFor(bulk)(TableBulkAction.Archive);

    expect(mutate).not.toHaveBeenCalled();
    expect(bulk.setBusy).not.toHaveBeenCalled();
    expect(bulk.reload).not.toHaveBeenCalled();
  });

  it('does nothing with an empty selection or without a list', async () => {
    const empty = makeBulk({ selectedIds: [], selectedCount: 0 });
    await runFor(empty)(TableBulkAction.Delete);
    const unlisted = makeBulk({ list: undefined });
    await runFor(unlisted)(TableBulkAction.Delete);

    expect(confirm).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
    expect(empty.reload).not.toHaveBeenCalled();
    expect(unlisted.reload).not.toHaveBeenCalled();
  });

  it('reports a partial failure with the first reason and still tells the host', async () => {
    confirm.mockResolvedValue(true);
    mutate.mockResolvedValue(
      answered(1, [
        { id: 'l2', message: 'Has open invoices' },
        { id: 'l3', message: 'Locked' },
      ]),
    );
    const bulk = makeBulk({ selectedIds: ['l1', 'l2', 'l3'], selectedCount: 3 });

    await runFor(bulk)(TableBulkAction.Archive);

    expect(notify).toHaveBeenCalledWith('{done} done, {failed} failed: {reason}', 'error', {
      done: 1,
      failed: 2,
      reason: 'Has open invoices',
    });
    expect(bulk.reload).toHaveBeenCalledTimes(1);
    expect(bulk.onDone).toHaveBeenCalledTimes(1);
  });

  it('does not tell the host when no row changed', async () => {
    confirm.mockResolvedValue(true);
    mutate.mockResolvedValue(answered(0, [{ id: 'l1', message: 'Locked' }]));
    const bulk = makeBulk({ selectedIds: ['l1'], selectedCount: 1 });

    await runFor(bulk)(TableBulkAction.Delete);

    expect(bulk.reload).toHaveBeenCalledTimes(1);
    expect(bulk.onDone).not.toHaveBeenCalled();
  });

  it('logs and reports a request that fails, unlocks and re-reads the grid', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    confirm.mockResolvedValue(true);
    mutate.mockRejectedValue(new Error('Forbidden'));
    const bulk = makeBulk();

    await runFor(bulk)(TableBulkAction.Delete);

    expect(logged).toHaveBeenCalledWith('Bulk table action failed', expect.any(Error), {
      list: 'listLeadsPaged',
      action: TableBulkAction.Delete,
      allMatching: false,
    });
    expect(notify).toHaveBeenCalledWith('Forbidden', 'error');
    expect(bulk.setBusy).toHaveBeenLastCalledWith(false);
    expect(bulk.reload).toHaveBeenCalledTimes(1);
    expect(bulk.onDone).not.toHaveBeenCalled();
    logged.mockRestore();
  });

  it('treats an answer with no data as a failure', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    mutate.mockResolvedValue({});
    const bulk = makeBulk({ onDone: undefined });

    await runFor(bulk)(TableBulkAction.Restore);

    expect(notify).toHaveBeenCalledWith('The table bulk action returned no data', 'error');
    expect(logged).toHaveBeenCalledTimes(1);
    logged.mockRestore();
  });

  it('collects every matching id through the fetcher, confirms the full count, then acts', async () => {
    confirm.mockResolvedValue(true);
    mutate.mockImplementation(async ({ variables }) => answered(variables.ids.length));
    const fetchRows = vi.fn<Fetch>(async ({ page }) => ({
      rows: Array.from({ length: page === 0 ? 200 : 40 }, (_, index) => ({
        id: `r${page * 200 + index}`,
      })),
      totalCount: 240,
    }));
    const bulk = makeBulk({
      fetchRows,
      allMatching: true,
      matching: { query: MATCHING_QUERY, total: 1240 },
    });

    await runFor(bulk)(TableBulkAction.Archive);

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Archive {count} rows matching the current filters? They leave this list; switch on Archived to see or restore them.',
        messageValues: { count: '1,240' },
      }),
    );
    expect(fetchRows).toHaveBeenNthCalledWith(1, { ...MATCHING_QUERY, page: 0, pageSize: 200 });
    expect(fetchRows).toHaveBeenNthCalledWith(2, { ...MATCHING_QUERY, page: 1, pageSize: 200 });
    expect(bulk.setProgress).toHaveBeenNthCalledWith(1, {
      label: 'Collecting rows… {done} of {total}',
      done: 200,
      total: 240,
    });
    expect(bulk.setProgress).toHaveBeenCalledWith({
      label: 'Archiving… {done} of {total}',
      done: 240,
      total: 240,
    });
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenCalledWith('{count} rows archived', 'success', { count: 240 });
    expect(bulk.clearSelection).toHaveBeenCalledTimes(1);
    expect(bulk.onDone).toHaveBeenCalledTimes(1);
  });

  it('refuses more matching rows than it acts on, asking to narrow the filters', async () => {
    const bulk = makeBulk({
      allMatching: true,
      matching: { query: MATCHING_QUERY, total: 10_001 },
    });

    await runFor(bulk)(TableBulkAction.Delete);

    expect(notify).toHaveBeenCalledWith(
      'More than {max} rows match. Narrow the search or filters to {max} or fewer and try again.',
      'error',
      { max: '10,000' },
    );
    expect(confirm).not.toHaveBeenCalled();
    expect(bulk.fetchRows).not.toHaveBeenCalled();
    expect(bulk.setBusy).not.toHaveBeenCalled();
  });

  it('logs, reports and re-reads when collecting the matching rows fails', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    const bulk = makeBulk({
      fetchRows: vi.fn<Fetch>().mockRejectedValue(new Error('Offline')),
      allMatching: true,
      matching: { query: MATCHING_QUERY, total: 300 },
    });

    await runFor(bulk)(TableBulkAction.Restore);

    expect(mutate).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith('Bulk table action failed', expect.any(Error), {
      list: 'listLeadsPaged',
      action: TableBulkAction.Restore,
      allMatching: true,
    });
    expect(notify).toHaveBeenCalledWith('Offline', 'error');
    expect(bulk.setProgress).toHaveBeenLastCalledWith(null);
    expect(bulk.reload).toHaveBeenCalledTimes(1);
    logged.mockRestore();
  });

  it('acts on the ticked rows while no query total is known yet', async () => {
    mutate.mockResolvedValue(answered(2));
    const bulk = makeBulk({ allMatching: true, matching: null });

    await runFor(bulk)(TableBulkAction.Restore);

    expect(bulk.fetchRows).not.toHaveBeenCalled();
    expect(mutate).toHaveBeenCalledWith({
      variables: { list: 'listLeadsPaged', ids: ['l1', 'l2'], action: TableBulkAction.Restore },
    });
  });
});
