import type { ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';

/** The create/edit state a page hands the dashboard, as far as a test reads it. */
export interface RecordedCrud {
  open: boolean;
  editing: unknown;
  close: () => void;
  onDone: () => void;
}

/** The CrudDashboard props the admin pages hand over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  entityLabel: string;
  exportFileName?: string;
  permissionModule?: string;
  stats: StatItem[];
  statsLoading?: boolean;
  crud?: RecordedCrud;
  renderForm?: (initial: null) => ReactNode;
  columnDefs: ColDef[];
  fetchRows: (input: TableQueryInput) => Promise<{ rows: unknown[]; totalCount: number }>;
  context: {
    actions: Record<string, (row: unknown) => unknown>;
    formatDateTime?: (value: string) => string;
  };
  onRowClick?: (row: unknown) => void;
  extraDialogs?: ReactNode;
  children?: ReactNode;
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

/** The stat tiles as label → value, so a test reads them the way a person scans them. */
export function statValues(): Record<string, string> {
  return Object.fromEntries(dashboardProps().stats.map((stat) => [stat.label, stat.value]));
}

/**
 * Stands in for `@exyconn/crud`'s CrudDashboard (ag-grid does not lay out under jsdom): it
 * records its props and renders the page's own extra dialogs and children.
 */
export function CrudDashboardStub(props: Readonly<DashboardProps>) {
  dashboard.props = props;
  return (
    <>
      {props.extraDialogs}
      {props.children}
    </>
  );
}

/** A table query as the grid sends it. */
export const TABLE_INPUT: TableQueryInput = { page: 1, pageSize: 25 };

/** A `TableStats` aggregation with the given total and `field → value → count` buckets. */
export function tableStats(total: number, counts: Record<string, Record<string, number>> = {}) {
  return {
    __typename: 'TableStats' as const,
    total,
    counts: Object.entries(counts).map(([field, buckets]) => ({
      __typename: 'StatFieldCounts' as const,
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({
        __typename: 'StatBucket' as const,
        value,
        count,
      })),
    })),
    sums: [],
  };
}
