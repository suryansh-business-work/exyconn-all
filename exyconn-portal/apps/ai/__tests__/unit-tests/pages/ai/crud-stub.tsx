import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import type { DocumentNode } from 'graphql';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';

/** A row handler as the page puts it on the grid context. */
type RowHandler = (row: object) => unknown;

/** The CrudDashboard props the AI pages hand over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  exportFileName: string;
  stats: StatItem[];
  statsLoading: boolean;
  crud: unknown;
  renderForm: (initial: object | null) => ReactElement;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, unknown>; formatDate?: (value: string) => string };
  searchPlaceholder: string;
  toolbar?: ReactNode;
  extraDialogs?: ReactNode;
}

/** What a page asked `useCrudResource` for. */
export interface CrudOptions {
  label: string;
  onDelete: (row: { id: string }) => Promise<unknown>;
  confirmMessage: (row: object) => unknown;
  refetch?: () => Promise<unknown>;
}

const dashboard: { props: DashboardProps | null } = { props: null };

/** Reads the recorded props, failing the test when the page never rendered the dashboard. */
export function dashboardProps(): DashboardProps {
  if (!dashboard.props) {
    throw new Error('CrudDashboard was not rendered');
  }
  return dashboard.props;
}

/** One of the row handlers the page put on the grid context. */
export function rowAction(key: string): RowHandler {
  return dashboardProps().context.actions[key] as RowHandler;
}

/**
 * Stands in for `@exyconn/crud`'s CrudDashboard (ag-grid does not lay out under jsdom): it
 * records its props and renders the page's toolbar and extra dialogs, which are the page's own.
 */
function CrudDashboardStub(props: Readonly<DashboardProps>) {
  dashboard.props = props;
  return (
    <>
      {props.toolbar}
      {props.extraDialogs}
    </>
  );
}

/** The resource the stand-in `useCrudResource` hands back, and the options it was given. */
export const crud = {
  options: null as CrudOptions | null,
  resource: {
    open: false,
    editing: null,
    refreshSignal: 0,
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    close: vi.fn(),
    reload: vi.fn(),
    onDone: vi.fn(),
    remove: vi.fn(),
  },
};

/** Reads the recorded `useCrudResource` options. */
export function crudOptions(): CrudOptions {
  if (!crud.options) {
    throw new Error('useCrudResource was not called');
  }
  return crud.options;
}

/** The document and page selector the page gave `usePagedFetcher`. */
export const paged = {
  document: null as DocumentNode | null,
  select: null as ((data: object) => unknown) | null,
  fetchRows: vi.fn(),
};

/** The `@exyconn/crud` members the pages are tested without. */
export const crudMocks = {
  CrudDashboard: CrudDashboardStub,
  useCrudResource: (options: CrudOptions) => {
    crud.options = options;
    return crud.resource;
  },
  usePagedFetcher: (document: DocumentNode, select: (data: object) => unknown) => {
    paged.document = document;
    paged.select = select;
    return paged.fetchRows;
  },
};
