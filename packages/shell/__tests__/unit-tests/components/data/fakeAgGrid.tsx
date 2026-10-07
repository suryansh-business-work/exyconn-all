import { useEffect, useImperativeHandle, type Ref } from 'react';
import type { ColDef, IDatasource } from 'ag-grid-community';
import { vi } from 'vitest';

/** What the fake grid was last rendered with, and what the component under test did to it. */
export const agGrid = {
  props: {} as FakeGridProps,
  datasource: null as IDatasource | null,
  purge: vi.fn(),
  /** When false, the grid ref carries no api — as before ag-grid has finished starting up. */
  withApi: true,
};

export interface FakeGridProps {
  ref?: Ref<unknown>;
  columnDefs: ColDef<unknown>[];
  defaultColDef: ColDef<unknown>;
  context?: object;
  cacheBlockSize: number;
  onGridReady: (event: {
    api: { setGridOption: (key: string, value: IDatasource) => void };
  }) => void;
  onRowClicked?: (event: { data?: unknown }) => void;
  rowStyle?: object;
}

function setGridOption(key: string, value: IDatasource): void {
  if (key === 'datasource') {
    agGrid.datasource = value;
  }
}

/**
 * Stands in for ag-grid's React grid, which needs a real layout engine: it records its props,
 * hands the datasource over on ready, and exposes `purgeInfiniteCache` through the ref.
 */
export function FakeAgGrid(props: Readonly<FakeGridProps>) {
  agGrid.props = props;
  useImperativeHandle(props.ref, () =>
    agGrid.withApi ? { api: { purgeInfiniteCache: agGrid.purge } } : {},
  );
  const { onGridReady } = props;
  useEffect(() => {
    onGridReady({ api: { setGridOption } });
  }, [onGridReady]);
  return (
    <div data-testid="ag-grid">
      {props.columnDefs.map((column) => (
        <span key={column.colId} role="columnheader">
          {column.headerName ?? column.colId}
        </span>
      ))}
    </div>
  );
}

export function resetFakeGrid(): void {
  agGrid.props = {} as FakeGridProps;
  agGrid.datasource = null;
  agGrid.purge.mockClear();
  agGrid.withApi = true;
}
