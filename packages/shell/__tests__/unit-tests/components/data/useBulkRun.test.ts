import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TableBulkAction, useTableBulkActionMutation } from '@/graphql/generated';
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

function makeBulk(patch: Partial<TableBulk> = {}): TableBulk {
  return {
    list: 'listLeadsPaged',
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
      messageValues: { count: 2 },
    });
    expect(mutate).toHaveBeenCalledWith({
      variables: { list: 'listLeadsPaged', ids: ['l1', 'l2'], action: TableBulkAction.Delete },
    });
    expect(bulk.setBusy).toHaveBeenNthCalledWith(1, true);
    expect(bulk.setBusy).toHaveBeenLastCalledWith(false);
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
});
