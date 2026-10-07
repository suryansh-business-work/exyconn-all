import type { ReactNode } from 'react';
import type { Column } from '@exyconn/shell/components/data/DataTable';
import type {
  OverviewBreakdown,
  OverviewLink,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { TrackerBillingQuery } from '@exyconn/shell/graphql/generated';

export interface OverviewProps {
  title: string;
  subtitle: string;
  stats: StatItem[];
  statsLoading?: boolean;
  breakdowns?: OverviewBreakdown[];
  links?: OverviewLink[];
  recentTitle?: string;
  children?: ReactNode;
}

export type TableRow = TrackerBillingQuery['trackerBilling']['rows'][number];

export interface TableProps {
  columns: Column<TableRow>[];
  rows: TableRow[];
  emptyMessage?: string;
  loading?: boolean;
  onRefresh?: () => unknown;
}

/** The props the page handed to the shell's overview and table on its latest render. */
export const captured: { overview: OverviewProps | null; table: TableProps | null } = {
  overview: null,
  table: null,
};

/** Records the overview's props and renders the table it wraps. */
export function ModuleOverviewStub(props: Readonly<OverviewProps>) {
  captured.overview = props;
  return <>{props.children}</>;
}

/** Records the table's props; the real grid is covered by the shell's own tests. */
export function DataTableStub(props: Readonly<TableProps>) {
  captured.table = props;
  return null;
}

export function overviewProps(): OverviewProps {
  if (!captured.overview) {
    throw new Error('ModuleOverview was not rendered');
  }
  return captured.overview;
}

export function tableProps(): TableProps {
  if (!captured.table) {
    throw new Error('DataTable was not rendered');
  }
  return captured.table;
}
