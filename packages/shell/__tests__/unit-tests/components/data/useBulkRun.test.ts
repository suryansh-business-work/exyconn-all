import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TableBulkAction, type TableQueryInput } from '@/graphql/generated';
import type { GridFetcher, TablePageResult } from '@/components/data/ServerDataGrid.types';
import { useBulkRun } from '@/components/data/useBulkRun';
import type { TableBulk } from '@/components/data/useTableBulk';
import type { BulkJobControl } from '@/components/data/useBulkJob';
import { portalLogger } from '@/logging/portalLogger';

const { confirm, notify } = vi.hoisted(() => ({ confirm: vi.fn(), notify: vi.fn() }));

vi.mock('@/components/feedback/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/components/feedback/NotificationProvider', () => ({ useNotify: () => notify }));

type Fetch = (input: TableQueryInput) => Promise<TablePageResult<unknown>>;

const MATCHING_QUERY = { search: 'acme', sort: null, sorts: [], filters: [] };

function jobControl(): BulkJobControl {
  return {
    job: null,
    running: false,
    finished: null,
    visible: false,
    dismiss: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
  };
}

/** A fetcher that hands a bulk job the variables of its list query, as usePagedFetcher's does. */
function queryFetcher(): GridFetcher<unknown> {
  return Object.assign(vi.fn<Fetch>(), {
    variablesFor: (input: TableQueryInput) => ({ input: { ...input, filters: [] } }),
  });
}

function makeBulk(patch: Partial<TableBulk> = {}): TableBulk {
  return {
    list: 'listLeadsPaged',
    fetchRows: queryFetcher(),
    selectedIds: ['l1', 'l2'],
    deletable: true,
    archivable: true,
    enabled: true,
    canSelectAll: true,
    selectedCount: 2,
    job: jobControl(),
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
    ...patch,
  };
}

function runFor(bulk: TableBulk) {
  return renderHook(() => useBulkRun(bulk)).result.current;
}

beforeEach(() => {
  confirm.mockReset();
  notify.mockReset();
});

describe('useBulkRun', () => {
  it('confirms a delete, queues one job for the ticked ids and clears the selection', async () => {
    confirm.mockResolvedValue(true);
    const bulk = makeBulk();

    await runFor(bulk)(TableBulkAction.Delete);

    expect(confirm).toHaveBeenCalledWith({
      message: 'Delete {count} selected rows? This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      messageValues: { count: '2' },
    });
    expect(bulk.job.start).toHaveBeenCalledWith({
      list: 'listLeadsPaged',
      action: TableBulkAction.Delete,
      ids: ['l1', 'l2'],
    });
    expect(bulk.clearSelection).toHaveBeenCalledTimes(1);
    expect(notify).not.toHaveBeenCalled();
  });

  it('restores without asking', async () => {
    const bulk = makeBulk();

    await runFor(bulk)(TableBulkAction.Restore);

    expect(confirm).not.toHaveBeenCalled();
    expect(bulk.job.start).toHaveBeenCalledWith(
      expect.objectContaining({ action: TableBulkAction.Restore }),
    );
  });

  it('does nothing when the person cancels the confirm', async () => {
    confirm.mockResolvedValue(false);
    const bulk = makeBulk();

    await runFor(bulk)(TableBulkAction.Archive);

    expect(bulk.job.start).not.toHaveBeenCalled();
    expect(bulk.clearSelection).not.toHaveBeenCalled();
  });

  it('does nothing with an empty selection or without a list', async () => {
    const empty = makeBulk({ selectedIds: [], selectedCount: 0 });
    await runFor(empty)(TableBulkAction.Delete);
    const unlisted = makeBulk({ list: undefined });
    await runFor(unlisted)(TableBulkAction.Delete);

    expect(confirm).not.toHaveBeenCalled();
    expect(empty.job.start).not.toHaveBeenCalled();
    expect(unlisted.job.start).not.toHaveBeenCalled();
  });

  it('hands every matching row to the server as the list query, confirming the full count', async () => {
    confirm.mockResolvedValue(true);
    const bulk = makeBulk({
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
    expect(bulk.job.start).toHaveBeenCalledWith({
      list: 'listLeadsPaged',
      action: TableBulkAction.Archive,
      variables: { input: { ...MATCHING_QUERY, page: 0, pageSize: 1, filters: [] } },
    });
  });

  it('acts on the ticked rows while no query total is known, or the fetcher cannot say', async () => {
    const unknownTotal = makeBulk({ allMatching: true, matching: null });
    await runFor(unknownTotal)(TableBulkAction.Restore);
    const plainFetcher = makeBulk({
      allMatching: true,
      matching: { query: MATCHING_QUERY, total: 90 },
      fetchRows: vi.fn<Fetch>(),
    });
    await runFor(plainFetcher)(TableBulkAction.Restore);

    for (const bulk of [unknownTotal, plainFetcher]) {
      expect(bulk.job.start).toHaveBeenCalledWith({
        list: 'listLeadsPaged',
        action: TableBulkAction.Restore,
        ids: ['l1', 'l2'],
      });
    }
  });

  it('logs and reports a job the server refuses, keeping the selection', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    const job = { ...jobControl(), start: vi.fn().mockRejectedValue(new Error('Forbidden')) };
    const bulk = makeBulk({ job });

    await runFor(bulk)(TableBulkAction.Restore);

    expect(logged).toHaveBeenCalledWith(
      'Could not start the bulk table action',
      expect.any(Error),
      {
        list: 'listLeadsPaged',
        action: TableBulkAction.Restore,
        allMatching: false,
      },
    );
    expect(notify).toHaveBeenCalledWith('Forbidden', 'error');
    expect(bulk.clearSelection).not.toHaveBeenCalled();
    logged.mockRestore();
  });
});
