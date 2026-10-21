import type { ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import type { GridFetcher } from '@exyconn/shell/components/data/ServerDataGrid';

/** What a page handed the grid, as the stand-ins record it. */
export interface RecordedGrid {
  columnDefs: ColDef[];
  fetchRows: GridFetcher<unknown>;
  context: {
    actions: Record<string, (row: unknown) => unknown>;
    formatDateTime?: (value: string) => string;
  };
  onRowClick?: (row: unknown) => void;
  refreshSignal?: number;
  title?: string;
  subtitle?: string;
  exportFileName?: string;
  extraDialogs?: ReactNode;
}

export const recorded: { grid: RecordedGrid | null } = { grid: null };

/** The props the page last rendered the grid with; fails the test when it never did. */
export function gridProps(): RecordedGrid {
  if (!recorded.grid) {
    throw new Error('The grid was not rendered');
  }
  return recorded.grid;
}

/**
 * Stands in for ag-grid (which does not lay out under jsdom): records the props and renders
 * the page's own dialogs, which belong to the page rather than the grid.
 */
export function GridStub(props: Readonly<RecordedGrid>) {
  recorded.grid = props;
  return <>{props.extraDialogs}</>;
}
