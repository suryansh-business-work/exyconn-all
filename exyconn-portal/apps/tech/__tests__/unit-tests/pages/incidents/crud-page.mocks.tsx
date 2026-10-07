import type { ReactElement } from 'react';
import { vi } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';

/** A grid row handler, as a panel puts it on the grid context. */
export type RowHandler = (row: object) => unknown;

/** The CrudDashboard props a panel hands over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  stats: StatItem[];
  statsLoading: boolean;
  crud: unknown;
  renderForm: (initial: unknown) => ReactElement;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, RowHandler>; formatDate: unknown };
  searchPlaceholder: string;
  extraDialogs?: ReactElement;
}

/** The options a panel passes `useCrudResource`. */
export interface ResourceOptions {
  label: string;
  onDelete: (row: object) => Promise<unknown>;
  confirmMessage: (row: object) => { message: string; values: Record<string, string> };
  refetch: unknown;
}

/** What a panel asked `usePagedFetcher` for. */
export interface FetcherCall {
  document: unknown;
  select: (data: object) => unknown;
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
 * recorders. The column helpers stay real, so a panel's grid is the real one. The dashboard
 * shows its title as a heading and renders the panel's extra dialogs.
 */
export async function crudModuleMock() {
  const actual = await vi.importActual<typeof import('@exyconn/crud')>('@exyconn/crud');
  return {
    ...actual,
    CrudDashboard: (props: Readonly<DashboardProps>) => {
      page.dashboard = props;
      return (
        <>
          <h1>{props.title}</h1>
          {props.extraDialogs}
        </>
      );
    },
    useCrudResource: (options: ResourceOptions) => {
      page.resource = options;
      return crud;
    },
    usePagedFetcher: (document: unknown, select: (data: object) => unknown) => {
      page.fetcher = { document, select };
      return fetchRows;
    },
  };
}

function recorded<T>(value: T | null, what: string): T {
  if (!value) {
    throw new Error(`${what} was not recorded`);
  }
  return value;
}

export const dashboardProps = () => recorded(page.dashboard, 'CrudDashboard');
export const resourceOptions = () => recorded(page.resource, 'useCrudResource');
export const fetcherCall = () => recorded(page.fetcher, 'usePagedFetcher');

/** The labels and values of the stat cards, in order. */
export function statPairs(): string[][] {
  return dashboardProps().stats.map((stat) => [stat.label, stat.value]);
}

/** A TableStats answer: a total and per-field bucket counts. */
export function statsOf(total: number, counts: Record<string, Record<string, number>> = {}) {
  return {
    total,
    counts: Object.entries(counts).map(([field, buckets]) => ({
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
    })),
    sums: [],
  };
}

/** The viewer's date formatter, as `useSettings` would hand it over — recognisable in output. */
export const formatDate = (value: string) => `on ${value}`;

/** Factory for `vi.mock('@exyconn/shell/hooks/useSettings', …)`. */
export function settingsModuleMock() {
  return { useSettings: () => ({ formatDate }) };
}
