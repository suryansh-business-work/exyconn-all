import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { Text } from '@exyconn/shell/components/ui';
import {
  HoursCell,
  ProgressCell,
  ProjectCell,
  RiskCell,
  TimelineCell,
  type PortfolioRow,
} from './portfolio-cells';

interface Props {
  rows: PortfolioRow[];
  loading?: boolean;
  onRefresh?: () => Promise<unknown>;
}

/**
 * Every project ranked by how much trouble it is in, worst first.
 *
 * The server already works all of this out — progress from the board, open bugs from the
 * tracker, hours from the same billing figures the time log shows, and a written reason for
 * every risk rating. Until now nothing called it, and the landing page showed counts
 * instead: four numbers that say how much work exists and nothing about whether any of it
 * is going well. A portfolio is opened to find the project in trouble, so the order is the
 * answer and every column beside it is the evidence.
 */
export function PortfolioTable({ rows, loading = false, onRefresh }: Readonly<Props>) {
  const navigate = useNavigate();

  const columns: Column<PortfolioRow>[] = [
    { key: 'name', label: 'Project', render: (row) => <ProjectCell row={row} /> },
    { key: 'risk', label: 'Risk', render: (row) => <RiskCell row={row} /> },
    { key: 'timeline', label: 'Timeline', render: (row) => <TimelineCell row={row} /> },
    { key: 'progress', label: 'Progress', render: (row) => <ProgressCell row={row} /> },
    { key: 'openBugCount', label: 'Open bugs', render: (row) => <Text>{row.openBugCount}</Text> },
    { key: 'hours', label: 'Hours', render: (row) => <HoursCell row={row} /> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      emptyMessage="No projects to report on yet."
      loading={loading}
      onRefresh={onRefresh}
      onRowClick={(row) => navigate(`/projects/${row.id}/health`)}
    />
  );
}
