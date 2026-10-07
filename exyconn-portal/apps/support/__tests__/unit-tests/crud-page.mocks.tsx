import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { ConfirmCopy } from '@exyconn/crud/page/useCrudResource';

/** The CrudDashboard props a Support register hands over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  exportFileName?: string;
  permissionModule?: string;
  stats: StatItem[];
  statsLoading: boolean;
  crud?: unknown;
  renderForm?: (initial: unknown) => ReactElement<Record<string, unknown>>;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, (row: unknown) => unknown>; formatDate?: unknown };
  searchPlaceholder: string;
  refreshSignal?: number;
  toolbar?: ReactNode;
  extraDialogs?: ReactNode;
}

/** The options a page passes `useCrudResource`. */
export interface ResourceOptions {
  label: string;
  onDelete: (row: unknown) => Promise<unknown>;
  confirmMessage: (row: unknown) => ConfirmCopy;
  refetch: unknown;
}

/** What `usePagedFetcher` was asked for on the last render. */
export interface FetcherCall {
  document: unknown;
  select: (data: unknown) => unknown;
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

/**
 * `@exyconn/crud` with the dashboard (ag-grid does not lay out under jsdom), the resource hook
 * and the paged fetcher replaced by recorders. The dashboard still renders the page's own
 * toolbar and extra dialogs, so a test can drive them. The column helpers stay real.
 */
export async function crudModuleMock() {
  const actual = await vi.importActual<typeof import('@exyconn/crud')>('@exyconn/crud');
  return {
    ...actual,
    CrudDashboard: (props: Readonly<DashboardProps>) => {
      page.dashboard = props;
      return (
        <>
          {props.toolbar}
          {props.extraDialogs}
        </>
      );
    },
    useCrudResource: (options: ResourceOptions) => {
      page.resource = options;
      return crud;
    },
    usePagedFetcher: (document: unknown, select: (data: unknown) => unknown, filters?: unknown) => {
      page.fetcher = { document, select, filters };
      return fetchRows;
    },
  };
}

/** Forgets the last render and every recorded call. */
export function resetCrudPage() {
  page.dashboard = null;
  page.resource = null;
  page.fetcher = null;
  for (const fn of Object.values(crud)) {
    fn.mockReset();
  }
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

/** Reads the recorded fetcher call, failing when the page never asked for one. */
export function fetcherCall(): FetcherCall {
  if (!page.fetcher) {
    throw new Error('usePagedFetcher was not called');
  }
  return page.fetcher;
}

/** The stat tiles as label → value, the way a person scans them. */
export function statValues(): Record<string, string> {
  return Object.fromEntries(dashboardProps().stats.map((stat) => [stat.label, stat.value]));
}
