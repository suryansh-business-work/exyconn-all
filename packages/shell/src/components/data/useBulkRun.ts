import { useCallback } from 'react';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useTableBulkActionMutation, type TableBulkAction } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { errorMessage } from '@/utils/errorMessage';
import { queryData } from '@/utils/queryData';
import { applyBulk, BULK_COPY, type BulkCall } from './tableBulkCopy';
import type { TableBulk } from './useTableBulk';

/**
 * Runs "Delete / Archive / Restore selected": asks first where the action loses something,
 * sends the selected ids in chunks, reports what went through (and the first failure), then
 * re-reads the grid and tells the host. Used by the bulk bar, which only mounts for a list the
 * server opens to bulk actions.
 */
export function useBulkRun(bulk: TableBulk): (action: TableBulkAction) => Promise<void> {
  const [mutate] = useTableBulkActionMutation();
  const confirm = useConfirm();
  const notify = useNotify();
  const { list, selectedIds, setBusy, clearSelection, reload, onDone } = bulk;

  const call = useCallback<BulkCall>(
    async (variables) =>
      queryData(await mutate({ variables }), 'The table bulk action').tableBulkAction,
    [mutate],
  );

  return async (action: TableBulkAction) => {
    if (!list || selectedIds.length === 0) {
      return;
    }
    const copy = BULK_COPY[action];
    const count = { count: selectedIds.length };
    if (copy.confirm && !(await confirm({ ...copy.confirm, messageValues: count }))) {
      return;
    }
    setBusy(true);
    let succeeded = 0;
    try {
      const result = await applyBulk(call, list, selectedIds, action);
      succeeded = result.succeeded;
      const [first] = result.failures;
      if (first) {
        notify('{done} done, {failed} failed: {reason}', 'error', {
          done: succeeded,
          failed: result.failures.length,
          reason: first.message,
        });
      } else {
        notify(copy.done, 'success', { count: succeeded });
      }
    } catch (failure) {
      portalLogger.error('Bulk table action failed', failure, { list, action });
      notify(errorMessage(failure, 'The bulk action failed'), 'error');
    } finally {
      setBusy(false);
    }
    // Some rows may have changed even when a later request failed: re-read either way.
    clearSelection();
    reload();
    if (succeeded > 0) {
      onDone?.();
    }
  };
}
