import { useFormatters } from '@exyconn/i18n';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import type { TableBulkAction } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { errorMessage } from '@/utils/errorMessage';
import { BULK_COPY } from './tableBulkCopy';
import type { TableBulk } from './useTableBulk';

type Copy = (typeof BULK_COPY)[TableBulkAction];
type ConfirmOptions = Parameters<ReturnType<typeof useConfirm>>[0];

type Confirm = ReturnType<typeof useConfirm>;

/** The confirm for an action, worded for the selected rows or for every matching row. */
function promptFor(copy: Copy, matching: boolean, count: string): ConfirmOptions | null {
  if (!copy.confirm) {
    return null;
  }
  const { message, matchingMessage, ...rest } = copy.confirm;
  return { ...rest, message: matching ? matchingMessage : message, messageValues: { count } };
}

/**
 * Asks first where the action loses something (deleting, archiving); true once the person
 * goes ahead, or straight away for an action that asks nothing (restoring).
 */
export async function approved(
  confirm: Confirm,
  copy: Copy,
  matching: boolean,
  count: string,
): Promise<boolean> {
  const prompt = promptFor(copy, matching, count);
  return prompt === null || confirm(prompt);
}

/** Every matching row: their count and the list's query, once chosen and the fetcher can say. */
interface MatchingScope {
  total: number;
  variables: Record<string, unknown>;
}

function matchingScope(bulk: TableBulk): MatchingScope | null {
  const { variablesFor } = bulk.fetchRows;
  if (!bulk.allMatching || !bulk.matching || !variablesFor) {
    return null;
  }
  const { query, total } = bulk.matching;
  return { total, variables: variablesFor({ ...query, page: 0, pageSize: 1 }) };
}

/**
 * Runs "Delete / Archive / Restore selected": asks first where the action loses something,
 * then queues it as one server-side job — the ticked ids, or (every matching row selected)
 * the grid's own query, which the server pages through itself — and clears the selection.
 * The job's progress shows in the toolbar while the person keeps working, and the grid is
 * re-read in place once it ends. Used by the bulk bar, which only mounts for a list the server
 * opens to bulk actions.
 */
export function useBulkRun(bulk: TableBulk): (action: TableBulkAction) => Promise<void> {
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatNumber } = useFormatters();
  const { list, selectedIds, clearSelection, job } = bulk;

  return async (action: TableBulkAction) => {
    const scope = matchingScope(bulk);
    const count = scope?.total ?? selectedIds.length;
    if (!list || count === 0) {
      return;
    }
    if (!(await approved(confirm, BULK_COPY[action], scope !== null, formatNumber(count)))) {
      return;
    }
    try {
      const rows = scope ? { variables: scope.variables } : { ids: [...selectedIds] };
      await job.start({ list, action, ...rows });
      clearSelection();
    } catch (failure) {
      portalLogger.error('Could not start the bulk table action', failure, {
        list,
        action,
        allMatching: scope !== null,
      });
      notify(errorMessage(failure, 'The bulk action failed'), 'error');
    }
  };
}
