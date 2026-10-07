import type { ReactNode } from 'react';
import type { DocumentNode } from 'graphql';
import type { ColDef } from 'ag-grid-community';
import type { TableFilterInput } from '@exyconn/shell/graphql/generated';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type {
  ChatSessionRow,
  ChatSessionsGridContext,
} from '../../../../../src/pages/chat/sessions/chat-sessions-grid';

/** The CrudDashboard props the chat list hands over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  stats: StatItem[];
  statsLoading: boolean;
  refreshSignal: number;
  columnDefs: ColDef<ChatSessionRow>[];
  fetchRows: unknown;
  context: ChatSessionsGridContext;
  onRowClick: (row: ChatSessionRow) => void;
  toolbar: ReactNode;
}

/** The last props the stand-in rendered with. */
export const dashboard: { props: DashboardProps | null } = { props: null };

/** Reads the recorded props, failing the test when the page never rendered the dashboard. */
export function dashboardProps(): DashboardProps {
  if (!dashboard.props) {
    throw new Error('CrudDashboard was not rendered');
  }
  return dashboard.props;
}

/**
 * Stands in for `@exyconn/crud`'s CrudDashboard (ag-grid does not lay out under jsdom): it
 * records its props, lists the stat tiles as "label: value", shows the refresh counter and
 * renders the page's toolbar.
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
      <output aria-label="refresh signal">{props.refreshSignal}</output>
      {props.toolbar}
    </div>
  );
}

/** What the page handed to usePagedFetcher on its last render. */
export const paged: {
  document: DocumentNode | null;
  select: ((data: never) => unknown) | null;
  filters: TableFilterInput[];
} = {
  document: null,
  select: null,
  filters: [],
};

const fetchRows = () => Promise.resolve({ rows: [], totalCount: 0 });

/** Stands in for usePagedFetcher: records the document, the page picker and the filters. */
export function usePagedFetcherStub(
  document: DocumentNode,
  select: (data: never) => unknown,
  filters: TableFilterInput[] = [],
) {
  paged.document = document;
  paged.select = select;
  paged.filters = filters;
  return fetchRows;
}
