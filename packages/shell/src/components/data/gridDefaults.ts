import type { ColDef, RowSelectionOptions } from 'ag-grid-community';
import { TEXT_FILTER_PARAMS } from './serverGridQuery';
import { skeletonWhileLoading } from './GridSkeletonCell';

/**
 * What a grid gets on a phone: most of the viewport, minus the chrome above it, so the page
 * scrolls once rather than nesting a second scroll inside a third.
 */
export const PHONE_GRID_HEIGHT = 'calc(100dvh - 240px)';

export const DEFAULT_PAGE_SIZE = 25;
/** What the pager offers; a grid built with another size gets that size offered first. */
const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function pageSizesFor(pageSize: number): number[] {
  return PAGE_SIZE_OPTIONS.includes(pageSize)
    ? PAGE_SIZE_OPTIONS
    : [pageSize, ...PAGE_SIZE_OPTIONS];
}

/** Row checkboxes for bulk actions. ag-grid's header "select all" needs a client-side model. */
export const BULK_SELECTION: RowSelectionOptions = {
  mode: 'multiRow',
  checkboxes: true,
  headerCheckbox: false,
};

/** Every column sorts, filters as text and draws a skeleton while its row loads. */
export function defaultColDefFor(onPhone: boolean): ColDef<unknown> {
  return {
    sortable: true,
    filter: 'agTextColumnFilter',
    filterParams: TEXT_FILTER_PARAMS,
    floatingFilter: !onPhone,
    resizable: true,
    flex: 1,
    minWidth: 120,
    cellRendererSelector: skeletonWhileLoading,
  };
}
