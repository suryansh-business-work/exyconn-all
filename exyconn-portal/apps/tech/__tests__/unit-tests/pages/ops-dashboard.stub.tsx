import type { ReactNode } from 'react';
import type { DocumentNode } from 'graphql';
import type { ColDef } from 'ag-grid-community';
import { vi } from 'vitest';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';

/** The CrudDashboard props a Tech register hands over, as the stand-in records them. */
export interface OpsDashboardProps {
  title: string;
  stats: StatItem[];
  statsLoading?: boolean;
  refreshSignal?: number;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, (row: never) => unknown>; formatDate?: unknown };
  onRowClick?: (row: never) => void;
  renderForm?: (initial: null) => ReactNode;
  crud?: unknown;
  toolbar?: ReactNode;
  extraDialogs?: ReactNode;
}

/** The last props the stand-in rendered with. */
export const opsDashboard: { props: OpsDashboardProps | null } = { props: null };

/** Reads the recorded props, failing the test when the page never rendered the dashboard. */
export function dashboardProps(): OpsDashboardProps {
  if (!opsDashboard.props) {
    throw new Error('CrudDashboard was not rendered');
  }
  return opsDashboard.props;
}

/**
 * Stands in for CrudDashboard (ag-grid does not lay out under jsdom): lists the stat tiles as
 * "label: value", shows the refresh signal, and renders the page's toolbar, form and dialogs.
 */
function CrudDashboardStub(props: Readonly<OpsDashboardProps>) {
  opsDashboard.props = props;
  return (
    <div>
      <h1>{props.title}</h1>
      <ul aria-label="stats">
        {props.stats.map((stat) => (
          <li key={stat.label}>{`${stat.label}: ${stat.value}`}</li>
        ))}
      </ul>
      <output aria-label="refresh signal">{props.refreshSignal ?? 0}</output>
      {props.toolbar}
      {props.renderForm?.(null)}
      {props.extraDialogs}
    </div>
  );
}

/** What the page handed to usePagedFetcher, and the fetcher the stand-in returns. */
export const paged: {
  document: DocumentNode | null;
  select: ((data: never) => unknown) | null;
  extraFilters: unknown;
  fetchRows: ReturnType<typeof vi.fn>;
} = { document: null, select: null, extraFilters: undefined, fetchRows: vi.fn() };

function usePagedFetcherStub(
  document: DocumentNode,
  select: (data: never) => unknown,
  extraFilters?: unknown,
) {
  paged.document = document;
  paged.select = select;
  paged.extraFilters = extraFilters;
  return paged.fetchRows;
}

/** The `useCrudResource` options a page passes, as the stand-in records them. */
export interface CrudOptions {
  label: string;
  onDelete: (row: never) => Promise<unknown>;
  confirmMessage: (row: never) => unknown;
  refetch?: unknown;
}

/** What `useCrudResource` was last called with, and the handlers the stand-in returns. */
export const crudResource: {
  options: CrudOptions | null;
  handlers: Record<string, ReturnType<typeof vi.fn>>;
} = {
  options: null,
  handlers: { openEdit: vi.fn(), remove: vi.fn(), close: vi.fn(), onDone: vi.fn() },
};

function useCrudResourceStub(options: CrudOptions) {
  crudResource.options = options;
  return { ...crudResource.handlers, open: false, editing: null };
}

/** `@exyconn/crud` with the dashboard and hooks replaced; the column helpers stay real. */
export async function crudModule() {
  const actual = await vi.importActual<object>('@exyconn/crud');
  return {
    ...actual,
    CrudDashboard: CrudDashboardStub,
    usePagedFetcher: usePagedFetcherStub,
    useCrudResource: useCrudResourceStub,
  };
}

/** Clears every recorder between tests. */
export function resetDashboard() {
  opsDashboard.props = null;
  paged.document = null;
  paged.select = null;
  paged.extraFilters = undefined;
  paged.fetchRows.mockReset();
  crudResource.options = null;
  for (const handler of Object.values(crudResource.handlers)) {
    handler.mockReset();
  }
}
