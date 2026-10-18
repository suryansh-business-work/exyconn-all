import { useCallback } from 'react';
import { useFormatters } from '@exyconn/i18n';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useTableBulkActionMutation, type TableBulkAction } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { errorMessage } from '@/utils/errorMessage';
import { queryData } from '@/utils/queryData';
import { collectMatchingIds, MAX_MATCHING_ROWS } from './collectMatchingIds';
import {
  applyBulk,
  BULK_COPY,
  COLLECTING_PROGRESS,
  TOO_MANY_MATCHING,
  type BulkCall,
} from './tableBulkCopy';
import type { TableBulk } from './useTableBulk';

type Copy = (typeof BULK_COPY)[TableBulkAction];
type Notify = ReturnType<typeof useNotify>;
type ConfirmOptions = Parameters<ReturnType<typeof useConfirm>>[0];

/** The confirm for an action, worded for the selected rows or for every matching row. */
function promptFor(copy: Copy, matching: boolean, count: string): ConfirmOptions | null {
  if (!copy.confirm) {
    return null;
  }
  const { message, matchingMessage, ...rest } = copy.confirm;
  return { ...rest, message: matching ? matchingMessage : message, messageValues: { count } };
}

/** The toast after the requests: every row through, or how many failed and the first reason. */
function report(notify: Notify, copy: Copy, result: Awaited<ReturnType<typeof applyBulk>>) {
  const [first] = result.failures;
  if (first) {
    notify('{done} done, {failed} failed: {reason}', 'error', {
      done: result.succeeded,
      failed: result.failures.length,
      reason: first.message,
    });
  } else {
    notify(copy.done, 'success', { count: result.succeeded });
  }
}

/**
 * Runs "Delete / Archive / Restore selected": asks first where the action loses something,
 * sends the ids in chunks, reports what went through (and the first failure), then re-reads
 * the grid and tells the host. With every matching row selected it first pages the grid's
 * fetcher through the current query to collect the ids (at most {@link MAX_MATCHING_ROWS}),
 * showing progress in the bar throughout. Used by the bulk bar, which only mounts for a list
 * the server opens to bulk actions.
 */
export function useBulkRun(bulk: TableBulk): (action: TableBulkAction) => Promise<void> {
  const [mutate] = useTableBulkActionMutation();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatNumber } = useFormatters();
  const { list, selectedIds, fetchRows, setBusy, setProgress, clearSelection, reload, onDone } =
    bulk;
  const scope = bulk.allMatching ? bulk.matching : null;

  const call = useCallback<BulkCall>(
    async (variables) =>
      queryData(await mutate({ variables }), 'The table bulk action').tableBulkAction,
    [mutate],
  );

  const idsToAct = async (): Promise<readonly string[]> => {
    if (!scope) {
      return selectedIds;
    }
    return collectMatchingIds(fetchRows, scope.query, (done, total) =>
      setProgress({ label: COLLECTING_PROGRESS, done, total }),
    );
  };

  return async (action: TableBulkAction) => {
    const count = scope?.total ?? selectedIds.length;
    if (!list || count === 0) {
      return;
    }
    if (count > MAX_MATCHING_ROWS) {
      notify(TOO_MANY_MATCHING, 'error', { max: formatNumber(MAX_MATCHING_ROWS) });
      return;
    }
    const copy = BULK_COPY[action];
    const prompt = promptFor(copy, scope !== null, formatNumber(count));
    if (prompt && !(await confirm(prompt))) {
      return;
    }
    setBusy(true);
    let succeeded = 0;
    try {
      const ids = await idsToAct();
      const result = await applyBulk(call, list, ids, action, (done) =>
        setProgress({ label: copy.progress, done, total: ids.length }),
      );
      succeeded = result.succeeded;
      report(notify, copy, result);
    } catch (failure) {
      portalLogger.error('Bulk table action failed', failure, {
        list,
        action,
        allMatching: scope !== null,
      });
      notify(errorMessage(failure, 'The bulk action failed'), 'error');
    } finally {
      setBusy(false);
      setProgress(null);
    }
    // Some rows may have changed even when a later request failed: re-read either way.
    clearSelection();
    reload();
    if (succeeded > 0) {
      onDone?.();
    }
  };
}
