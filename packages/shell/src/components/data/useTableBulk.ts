import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import type { IRowNode, SelectionChangedEvent } from 'ag-grid-community';
import { useTableBulkInfoQuery } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import type { GridQuery } from './serverGridQuery';
import type { GridFetcher } from './ServerDataGrid.types';
import { selectedIdsOf } from './tableBulkCopy';

interface TableBulkOptions {
  /** The list the server knows the rows by; without one there are no bulk actions. */
  list: string | undefined;
  gridRef: RefObject<AgGridReact<unknown> | null>;
  /** The grid's page loader; "Select all matching" pages through it to collect the ids. */
  fetchRows: GridFetcher<unknown>;
  /** Re-reads the grid from the first row. */
  reload: () => void;
  /** Told after any bulk action that changed at least one row. */
  onDone?: () => void;
}

/** The query the grid last loaded rows with, and how many rows the server says match it. */
export interface MatchingRows {
  query: GridQuery;
  total: number;
}

/** What the bar shows while a bulk action runs: an English line with `{done}` and `{total}`. */
export interface BulkProgress {
  label: string;
  done: number;
  total: number;
}

export interface TableBulk {
  list: string | undefined;
  fetchRows: GridFetcher<unknown>;
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
  /** The current query and its server total, once a page has loaded. */
  matching: MatchingRows | null;
  /** Told by the datasource after every page it loads. */
  setMatching: (query: GridQuery, total: number) => void;
  /** True once the person chose every row matching the current query, not just the checked. */
  allMatching: boolean;
  selectAllMatching: () => void;
  progress: BulkProgress | null;
  setProgress: (progress: BulkProgress | null) => void;
}

/**
 * Which bulk actions a server-paged grid offers, its row selection and its Archived switch
 * (the actions themselves run in {@link useBulkRun}). Rows are known by position in ag-grid's
 * infinite model, so the selection is cleared whenever the rows under it change (reload,
 * search, sort, filter, switch). ag-grid cannot select across that model, so "Select all
 * matching" is a flag over the query the grid last loaded; clearing the selection drops it.
 */
export function useTableBulk({
  list,
  gridRef,
  fetchRows,
  reload,
  onDone,
}: TableBulkOptions): TableBulk {
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
  const [matching, setMatchingState] = useState<MatchingRows | null>(null);
  const [allMatching, setAllMatching] = useState(false);
  const [progress, setProgress] = useState<BulkProgress | null>(null);

  // Ticking or unticking a row narrows the choice back to the ticked rows.
  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    setAllMatching(false);
    setSelectedIds(selectedIdsOf(event.api.getSelectedRows()));
  }, []);
  const clearSelection = useCallback(() => {
    gridRef.current?.api?.deselectAll();
    setSelectedIds([]);
    setAllMatching(false);
  }, [gridRef]);
  const setMatching = useCallback(
    (query: GridQuery, total: number) => setMatchingState({ query, total }),
    [],
  );
  const selectAllMatching = useCallback(() => setAllMatching(true), []);

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
    fetchRows,
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
    matching,
    setMatching,
    allMatching,
    selectAllMatching,
    progress,
    setProgress,
  };
}
