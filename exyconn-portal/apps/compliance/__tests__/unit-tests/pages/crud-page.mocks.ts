import type { ReactElement } from 'react';
import { vi } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { ConfirmCopy } from '@exyconn/crud/page/useCrudResource';

/** The CrudDashboard props a register page hands over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  exportFileName: string;
  stats: StatItem[];
  statsLoading: boolean;
  crud: unknown;
  renderForm: (initial: unknown) => ReactElement;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, unknown>; formatDate: unknown };
  searchPlaceholder: string;
}

/** The options a page passes `useCrudResource`. */
export interface ResourceOptions {
  label: string;
  onDelete: (row: unknown) => Promise<unknown>;
  confirmMessage: (row: unknown) => ConfirmCopy;
  refetch: unknown;
}

/** What the stand-ins saw on the last render. */
export const page: {
  dashboard: DashboardProps | null;
  resource: ResourceOptions | null;
  fetcher: { document: unknown; select: (data: unknown) => unknown } | null;
} = { dashboard: null, resource: null, fetcher: null };

/** The resource the stand-in `useCrudResource` returns. */
export const crud = {
  openEdit: vi.fn(),
  remove: vi.fn(),
  close: vi.fn(),
  onDone: vi.fn(),
};

export const fetchRows = vi.fn();

/** The viewer's date formatter, as `useSettings` would hand it over. */
export const formatDate = (value: string) => `on ${value}`;

/**
 * `@exyconn/crud` with the parts that need ag-grid, a router and the confirm/notify providers
 * replaced by recorders; the column helpers stay real, so the page's grid is the real one.
 */
export async function crudModuleMock() {
  const actual = await vi.importActual<typeof import('@exyconn/crud')>('@exyconn/crud');
  return {
    ...actual,
    CrudDashboard: (props: Readonly<DashboardProps>) => {
      page.dashboard = props;
      return null;
    },
    useCrudResource: (options: ResourceOptions) => {
      page.resource = options;
      return crud;
    },
    usePagedFetcher: (document: unknown, select: (data: unknown) => unknown) => {
      page.fetcher = { document, select };
      return fetchRows;
    },
  };
}

export function settingsModuleMock() {
  return { useSettings: () => ({ formatDate }) };
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
