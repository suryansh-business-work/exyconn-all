import { useMemo } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Typography, fontWeight } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { panel } from '@exyconn/shell/components/glass/glass';
import type { FlowRow } from './analytics.data';

interface FlowTableProps {
  rows: FlowRow[];
  onSelect: (row: FlowRow) => void;
}

/**
 * Started, completed and abandoned per workflow. A row opens that workflow's funnel below;
 * DataTable makes the rows focusable and opens them on Enter and Space too.
 */
export function FlowTable({ rows, onSelect }: Readonly<FlowTableProps>) {
  const t = useT();
  const { formatNumber, formatPercent } = useFormatters();

  const columns = useMemo<Column<FlowRow>[]>(
    () => [
      { key: 'industry', label: 'Industry' },
      { key: 'name', label: 'Workflow' },
      { key: 'started', label: 'Started', render: (row) => formatNumber(row.started) },
      { key: 'completed', label: 'Completed', render: (row) => formatNumber(row.completed) },
      { key: 'abandoned', label: 'Abandoned', render: (row) => formatNumber(row.abandoned) },
      {
        key: 'completionPct',
        label: 'Completion',
        render: (row) => formatPercent(row.completionPct),
      },
    ],
    [formatNumber, formatPercent],
  );

  return (
    <Box sx={panel}>
      <Typography variant="subtitle2" component="h2" sx={{ fontWeight: fontWeight.bold }}>
        {t('Flow breakdown')}
      </Typography>
      <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mb: 1.5 }}>
        {t('Select a workflow to see where people left it.')}
      </Typography>
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={onSelect}
        emptyMessage="No workflow was started in this period."
      />
    </Box>
  );
}
