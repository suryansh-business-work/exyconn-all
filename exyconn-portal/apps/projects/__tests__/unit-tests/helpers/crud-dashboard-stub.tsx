import type { ReactNode } from 'react';
import type { DocumentNode } from 'graphql';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';

type RowAction = (row: object) => Promise<void> | void;

/** The CrudDashboard props the Projects pages hand over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  exportFileName: string;
  stats: StatItem[];
  statsLoading: boolean;
  crud: { open: boolean; editing: unknown; openCreate: () => void };
  renderForm: (initial: never) => ReactNode;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, RowAction>; formatDate?: (value: string) => string };
  searchPlaceholder: string;
  onRowClick?: (row: never) => void;
  extraDialogs?: ReactNode;
}

/** The last props the stand-in rendered with. */
export const dashboard: { props: DashboardProps | null } = { props: null };

/** Reads the recorded props, failing the test when the page never rendered the dashboard. */
export function dashboardProps(): DashboardProps {
  if (!dashboard.props) throw new Error('CrudDashboard was not rendered');
  return dashboard.props;
}

/**
 * Stands in for `@exyconn/crud`'s CrudDashboard (ag-grid does not lay out under jsdom): it
 * records its props, lists the stat tiles as "label: value", and renders what the real one
 * renders from the page's own props — the form while the CRUD state is open, and the page's
 * extra dialogs.
 */
export function CrudDashboardStub(props: Readonly<DashboardProps>) {
  dashboard.props = props;
  return (
    <div>
      <h1>{props.title}</h1>
      <ul aria-label="stats">
        {props.stats.map((stat) => (
          <li key={stat.label}>{`${stat.label}: ${stat.value}`}</li>
        ))}
      </ul>
      <button type="button" onClick={props.crud.openCreate}>
        Open new form
      </button>
      {props.crud.open && props.renderForm(props.crud.editing as never)}
      {props.extraDialogs}
    </div>
  );
}

/** What the page handed to usePagedFetcher, and the fetcher the stand-in returned. */
export const paged: {
  document: DocumentNode | null;
  select: ((data: never) => unknown) | null;
  fetchRows: () => Promise<{ rows: unknown[]; totalCount: number }>;
} = {
  document: null,
  select: null,
  fetchRows: () => Promise.resolve({ rows: [], totalCount: 0 }),
};

/** Stands in for usePagedFetcher: records the document and the page picker it was given. */
export function usePagedFetcherStub(document: DocumentNode, select: (data: never) => unknown) {
  paged.document = document;
  paged.select = select;
  return paged.fetchRows;
}
