import { useCallback, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useFormatters } from '@exyconn/i18n';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { TableBulkAction } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { errorMessage } from '@/utils/errorMessage';
import { evictRows } from './evictRows';
import { BULK_COPY } from './tableBulkCopy';
import { approved } from './useBulkRun';
import { useBulkJob, type BulkJob, type BulkJobControl } from './useBulkJob';

/** The row selection and "Delete selected" of a client-side {@link DataTable}. */
export interface DataTableBulk {
  /** The ticked rows still in the table. */
  selectedIds: readonly string[];
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  /** True when every row is ticked; ticking the header again clears them. */
  allSelected: boolean;
  toggleAll: () => void;
  clear: () => void;
  deleteSelected: () => Promise<void>;
  job: BulkJobControl;
}

/**
 * Selection and bulk delete for a table whose rows the page already holds. The delete runs as
 * a server-side job by entity (`delete<Entity>(id)` for each row, guards and audit included);
 * once it ends, the rows that went are evicted from the Apollo cache, so every list holding
 * them drops them without refetching anything. The rows that stayed keep their checkboxes off.
 */
export function useDataTableBulk<T extends { id: string }>(
  rows: readonly T[],
  entity: string,
): DataTableBulk {
  const client = useApolloClient();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatNumber } = useFormatters();
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const sentRef = useRef<readonly string[]>([]);

  const selectedIds = useMemo(
    () => rows.map((row) => row.id).filter((id) => ticked.has(id)),
    [rows, ticked],
  );

  const job = useBulkJob((finished: BulkJob) => {
    const failed = new Set(finished.failures.map((failure) => failure.id));
    const gone = new Set(sentRef.current.filter((id) => !failed.has(id)));
    evictRows(
      client.cache,
      rowsRef.current.filter((row) => gone.has(row.id)),
    );
  });

  const toggle = useCallback((id: string) => {
    setTicked((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const toggleAll = useCallback(() => {
    setTicked(allSelected ? new Set() : new Set(rowsRef.current.map((row) => row.id)));
  }, [allSelected]);
  const clear = useCallback(() => setTicked(new Set()), []);
  const isSelected = useCallback((id: string) => ticked.has(id), [ticked]);

  const deleteSelected = async () => {
    const ids = selectedIds;
    const copy = BULK_COPY[TableBulkAction.Delete];
    if (!(await approved(confirm, copy, false, formatNumber(ids.length)))) {
      return;
    }
    try {
      sentRef.current = ids;
      await job.start({ entity, action: TableBulkAction.Delete, ids: [...ids] });
      clear();
    } catch (failure) {
      portalLogger.error('Could not start the bulk delete', failure, { entity });
      notify(errorMessage(failure, 'The bulk action failed'), 'error');
    }
  };

  return { selectedIds, isSelected, toggle, allSelected, toggleAll, clear, deleteSelected, job };
}
