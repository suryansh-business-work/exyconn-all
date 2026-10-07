import type { ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';

/** The CrudDashboard props the client hub pages hand over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  entityLabel: string;
  exportFileName?: string;
  stats: StatItem[];
  statsLoading?: boolean;
  refreshSignal?: number;
  columnDefs: ColDef[];
  fetchRows: (input: TableQueryInput) => Promise<{ rows: unknown[]; totalCount: number }>;
  context: {
    actions: Record<string, (row: never) => void>;
    formatDate: (value: string) => string;
  };
  onRowClick?: (row: never) => void;
  toolbar?: ReactNode;
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
 * records its props and renders the page's toolbar and extra dialogs, which are the page's own.
 */
export function CrudDashboardStub(props: Readonly<DashboardProps>) {
  dashboard.props = props;
  return (
    <>
      {props.toolbar}
      {props.extraDialogs}
    </>
  );
}

/** A table query as the grid sends it. */
export const TABLE_INPUT: TableQueryInput = { page: 1, pageSize: 25 };
