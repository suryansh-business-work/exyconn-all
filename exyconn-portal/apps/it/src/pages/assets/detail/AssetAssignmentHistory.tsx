import { Card, Chip, Typography } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import type { AssetAssignmentsQuery } from '@exyconn/shell/graphql/generated';

export type AssignmentRow = AssetAssignmentsQuery['assetAssignments'][number];

interface AssetAssignmentHistoryProps {
  rows: readonly AssignmentRow[];
  loading: boolean;
  /** The viewer's own date formatting, from Admin > Settings. */
  formatDate: (value: string) => string;
}

/** "Still holds it" against the date it went back — the one thing this table is read for. */
function ReturnedCell({
  row,
  formatDate,
}: Readonly<{ row: AssignmentRow; formatDate: (v: string) => string }>) {
  if (row.returnedAt) {
    return <>{formatDate(row.returnedAt)}</>;
  }
  return <Chip size="small" color="success" label="Still held" />;
}

/**
 * Every spell this asset has been held for, most recent first.
 *
 * A row is opened when the asset is handed over and closed when it moves on or its status
 * leaves ASSIGNED, so somebody who has left keeps a closed row here rather than an open one
 * against a machine that is now on somebody else's desk.
 */
export function AssetAssignmentHistory({
  rows,
  loading,
  formatDate,
}: Readonly<AssetAssignmentHistoryProps>) {
  const columns: Column<AssignmentRow>[] = [
    { key: 'employeeName', label: 'Held by', render: (row) => row.employeeName || row.employeeId },
    { key: 'assignedAt', label: 'From', render: (row) => formatDate(row.assignedAt) },
    {
      key: 'returnedAt',
      label: 'Until',
      render: (row) => <ReturnedCell row={row} formatDate={formatDate} />,
    },
    { key: 'assignedByName', label: 'Handed over by', render: (row) => row.assignedByName || '—' },
    { key: 'note', label: 'Note', render: (row) => row.note || '—' },
  ];

  return (
    <Card variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 1.5
        }}>
        Assignment history ({rows.length})
      </Typography>
      <DataTable
        columns={columns}
        rows={[...rows]}
        emptyMessage={loading ? 'Loading…' : 'This asset has never been assigned.'}
      />
    </Card>
  );
}
