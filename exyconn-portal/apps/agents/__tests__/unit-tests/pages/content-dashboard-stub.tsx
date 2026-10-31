import type { ReactNode } from 'react';
import type { DocumentNode } from 'graphql';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';

type RowAction = (row: object) => Promise<void> | void;

/** The CrudDashboard props the website content pages hand over, as the stand-in records them. */
export interface ContentDashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  actionLabel?: string;
  exportFileName: string;
  stats: StatItem[];
  statsLoading: boolean;
  crud?: { open: boolean; editing: unknown; openCreate: () => void };
  renderForm?: (initial: never) => ReactNode;
  refreshSignal?: number;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, RowAction>; formatDate?: (value: string) => string };
  searchPlaceholder: string;
  toolbar?: ReactNode;
  extraDialogs?: ReactNode;
}

/** The last props the stand-in rendered with. */
export const contentDashboard: { props: ContentDashboardProps | null } = { props: null };

/** Reads the recorded props, failing the test when the page never rendered the dashboard. */
export function dashboardProps(): ContentDashboardProps {
  if (!contentDashboard.props) throw new Error('CrudDashboard was not rendered');
  return contentDashboard.props;
}

/** The stat tiles as `label → value`. */
export function statValues(): Record<string, string> {
  return Object.fromEntries(dashboardProps().stats.map((stat) => [stat.label, stat.value]));
}

/**
 * Stands in for `@exyconn/crud`'s CrudDashboard (ag-grid does not lay out under jsdom): it
 * records its props and renders what the real one renders from the page's own props — the
 * "new" button when the page has a CRUD resource, the form while it is open, the toolbar and
 * the page's extra dialogs.
 */
export function CrudDashboardStub(props: Readonly<ContentDashboardProps>) {
  contentDashboard.props = props;
  const { crud, renderForm } = props;
  return (
    <div>
      <h1>{props.title}</h1>
      {crud && (
        <button type="button" onClick={crud.openCreate}>
          Open new form
        </button>
      )}
      {props.toolbar}
      {crud?.open && renderForm?.(crud.editing as never)}
      {props.extraDialogs}
    </div>
  );
}

/** What the page handed to usePagedFetcher, and the fetcher the stand-in returned. */
export const paged: {
  document: DocumentNode | null;
  select: ((data: never) => unknown) | null;
  extraFilters: unknown;
  fetchRows: () => Promise<{ rows: unknown[]; totalCount: number }>;
} = {
  document: null,
  select: null,
  extraFilters: undefined,
  fetchRows: () => Promise.resolve({ rows: [], totalCount: 0 }),
};

/** Stands in for usePagedFetcher: records the document, the page picker and the filters. */
export function usePagedFetcherStub(
  document: DocumentNode,
  select: (data: never) => unknown,
  extraFilters?: unknown,
) {
  paged.document = document;
  paged.select = select;
  paged.extraFilters = extraFilters;
  return paged.fetchRows;
}
