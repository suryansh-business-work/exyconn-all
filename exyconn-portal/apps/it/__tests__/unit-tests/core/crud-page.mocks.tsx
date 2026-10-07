import type { ReactElement } from 'react';
import { vi } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { ConfirmCopy } from '@exyconn/crud/page/useCrudResource';

/** A grid row handler, as a page puts it on the grid context. */
export type RowHandler = (row: object) => unknown;

/** The CrudDashboard props an IT page hands over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  exportFileName?: string;
  permissionModule?: string;
  stats: StatItem[];
  statsLoading: boolean;
  crud?: unknown;
  renderForm?: (initial: unknown) => ReactElement;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, RowHandler>; formatDate?: unknown };
  searchPlaceholder: string;
  onRowClick?: RowHandler;
  refreshSignal?: number;
  toolbar?: ReactElement<Record<string, unknown>>;
  extraDialogs?: ReactElement<Record<string, unknown>>;
}

/** The options a page passes `useCrudResource`. */
export interface ResourceOptions {
  label: string;
  onDelete: (row: object) => Promise<unknown>;
  confirmMessage: (row: object) => ConfirmCopy;
  refetch: unknown;
}

/** What a page asked `usePagedFetcher` for. */
export interface FetcherCall {
  document: unknown;
  select: (data: object) => unknown;
  filters: unknown;
}

/** What the stand-ins saw on the last render. */
export const page: {
  dashboard: DashboardProps | null;
  resource: ResourceOptions | null;
  fetcher: FetcherCall | null;
} = { dashboard: null, resource: null, fetcher: null };

/** The resource the stand-in `useCrudResource` returns. */
export const crud = {
  openEdit: vi.fn(),
  remove: vi.fn(),
  close: vi.fn(),
  onDone: vi.fn(),
  reload: vi.fn(),
};

export const fetchRows = vi.fn();

/** Forgets the last render and every recorded call. */
export function resetPage() {
  page.dashboard = null;
  page.resource = null;
  page.fetcher = null;
  Object.values(crud).forEach((fn) => fn.mockReset());
}

/**
 * `@exyconn/crud` with the dashboard, the resource hook and the paged fetcher replaced by
 * recorders. The column helpers stay real, so a page's grid is the real one. The dashboard
 * renders the page's extra dialogs, which is where its decision and detail drawers live.
 */
export async function crudModuleMock() {
  const actual = await vi.importActual<typeof import('@exyconn/crud')>('@exyconn/crud');
  return {
    ...actual,
    CrudDashboard: (props: Readonly<DashboardProps>) => {
      page.dashboard = props;
      return <>{props.extraDialogs}</>;
    },
    useCrudResource: (options: ResourceOptions) => {
      page.resource = options;
      return crud;
    },
    usePagedFetcher: (
      document: unknown,
      select: (data: object) => unknown,
      filters: unknown = [],
    ) => {
      page.fetcher = { document, select, filters };
      return fetchRows;
    },
  };
}

/** Reads the recorded dashboard props, failing when the page never rendered one. */
export function dashboardProps(): DashboardProps {
  if (!page.dashboard) {
    throw new Error('CrudDashboard was not rendered');
  }
  return page.dashboard;
}

/** Reads the recorded resource options, failing when the page never asked for one. */
export function resourceOptions(): ResourceOptions {
  if (!page.resource) {
    throw new Error('useCrudResource was not called');
  }
  return page.resource;
}

/** Reads the recorded paged fetcher call, failing when the page never asked for one. */
export function fetcherCall(): FetcherCall {
  if (!page.fetcher) {
    throw new Error('usePagedFetcher was not called');
  }
  return page.fetcher;
}

/** The labels and values of the stat cards, in order. */
export function statPairs(): string[][] {
  return dashboardProps().stats.map((stat) => [stat.label, stat.value]);
}

/** A TableStats answer: a total, per-field bucket counts and per-field sums. */
export function statsOf(
  total: number,
  counts: Record<string, Record<string, number>>,
  sums: Record<string, number> = {},
) {
  return {
    total,
    counts: Object.entries(counts).map(([field, buckets]) => ({
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
    })),
    sums: Object.entries(sums).map(([field, sum]) => ({ field, total: sum })),
  };
}
