import { useFormatters } from '@exyconn/i18n';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { PositionRow } from '../forms/position';

interface PositionsTableProps {
  positions: PositionRow[];
  onEdit: (row: PositionRow) => void;
  onDelete: (row: PositionRow) => void;
}

/** A department's positions: salary band, grade and how many approved seats are filled. */
export function PositionsTable({ positions, onEdit, onDelete }: Readonly<PositionsTableProps>) {
  const { formatCurrency } = useFormatters();
  const band = (row: PositionRow) =>
    `${formatCurrency(row.minSalary, { maximumFractionDigits: 0 })} – ${formatCurrency(row.maxSalary, { maximumFractionDigits: 0 })}`;

  const columns: Column<PositionRow>[] = [
    { key: 'name', label: 'Position' },
    { key: 'code', label: 'Code', render: (r) => r.code ?? '—' },
    { key: 'band', label: 'Salary / month', render: band },
    { key: 'grade', label: 'Grade', render: (r) => r.grade ?? '—' },
    { key: 'employmentType', label: 'Type', render: (r) => r.employmentType ?? '—' },
    { key: 'seats', label: 'Filled', render: (r) => `${r.filled} / ${r.headcount}` },
    {
      key: 'active',
      label: 'Hiring',
      render: (r) => <StatusChip value={r.active ? 'OPEN' : 'CLOSED'} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={positions}
      onEdit={onEdit}
      onDelete={onDelete}
      emptyMessage="No positions in this department yet."
    />
  );
}
