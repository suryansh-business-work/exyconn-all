import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { IRowNode, SelectionChangedEvent } from 'ag-grid-community';
import { useTableBulkInfoQuery } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { selectedIdsOf } from './tableBulkCopy';

interface TableBulkOptions {
  /** The list the server knows the rows by; without one there are no bulk actions. */
  list: string | undefined;
  gridRef: RefObject<AgGridReact<unknown> | null>;
  /** Re-reads the grid from the first row. */
  reload: () => void;
  /** Told after any bulk action that changed at least one row. */
  onDone?: () => void;
}

export interface TableBulk {
  list: string | undefined;
  selectedIds: readonly string[];
  deletable: boolean;
  archivable: boolean;
  /** True when rows can be selected at all — the list is deletable or archivable. */
  enabled: boolean;
  selectedCount: number;
  /** True while a bulk request runs; the bar and the switch lock. */
  busy: boolean;
  setBusy: (busy: boolean) => void;
  /** Re-reads the grid from the first row. */
  reload: () => void;
  onDone?: () => void;
  /** Whether the grid shows archived rows instead of live ones. */
  archived: boolean;
  /** Read by the datasource at fetch time, so a page request carries the switch. */
  archivedRef: RefObject<boolean>;
  setArchived: (archived: boolean) => void;
  onSelectionChanged: (event: SelectionChangedEvent) => void;
  clearSelection: () => void;
  /** Selects every loaded row on the page the pager shows. */
  selectPage: () => void;
}

/**
 * Which bulk actions a server-paged grid offers, its row selection and its Archived switch
 * (the actions themselves run in {@link useBulkRun}). Rows are known by position in ag-grid's
 * infinite model, so the selection is cleared whenever the rows under it change (reload,
 * search, sort, filter, switch).
 */
export function useTableBulk({ list, gridRef, reload, onDone }: TableBulkOptions): TableBulk {
  const { data, error } = useTableBulkInfoQuery({
    variables: { list: list ?? '' },
    skip: !list,
    fetchPolicy: 'cache-first',
  });
  useEffect(() => {
    if (error) {
      portalLogger.error('Could not load which bulk actions the grid offers', error, { list });
    }
  }, [error, list]);
  const deletable = data?.tableBulkInfo.deletable ?? false;
  const archivable = data?.tableBulkInfo.archivable ?? false;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archived, setArchivedState] = useState(false);
  const archivedRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => setSelectedIds(selectedIdsOf(event.api.getSelectedRows())),
    [],
  );
  const clearSelection = useCallback(() => {
    gridRef.current?.api?.deselectAll();
    setSelectedIds([]);
  }, [gridRef]);

  const selectPage = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) {
      return;
    }
    const size = api.paginationGetPageSize();
    const first = api.paginationGetCurrentPage() * size;
    const nodes: IRowNode[] = [];
    for (let index = first; index < first + size; index += 1) {
      const node = api.getDisplayedRowAtIndex(index);
      if (node?.data) {
        nodes.push(node);
      }
    }
    api.setNodesSelected({ nodes, newValue: true });
  }, [gridRef]);

  const setArchived = useCallback(
    (next: boolean) => {
      archivedRef.current = next;
      setArchivedState(next);
      clearSelection();
      reload();
    },
    [clearSelection, reload],
  );

  return {
    list,
    selectedIds,
    deletable,
    archivable,
    enabled: deletable || archivable,
    selectedCount: selectedIds.length,
    busy,
    setBusy,
    reload,
    onDone,
    archived,
    archivedRef,
    setArchived,
    onSelectionChanged,
    clearSelection,
    selectPage,
  };
}
