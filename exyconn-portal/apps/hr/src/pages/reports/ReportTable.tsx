import { Box, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import type { CsvColumn } from '@exyconn/shell/utils/csv';

interface ReportTableProps {
  columns: CsvColumn<unknown>[];
  rows: unknown[];
  loading: boolean;
  /** Only this many rows render on screen; the CSV always has every row. */
  previewLimit: number;
}

/** Renders a report's rows with the same column definitions that drive its CSV. */
export function ReportTable({ columns, rows, loading, previewLimit }: Readonly<ReportTableProps>) {
  const tableColumns: Column<{ id: string; row: unknown }>[] = columns.map((c) => ({
    key: c.header,
    label: c.header,
    render: (item) => {
      const value = c.value(item.row);
      if (value === null || value === undefined || value === '') return '—';
      return String(value);
    },
  }));
  const preview = rows.slice(0, previewLimit).map((row, index) => ({ id: String(index), row }));

  return (
    <Box>
      <DataTable
        columns={tableColumns}
        rows={preview}
        emptyMessage={loading ? 'Loading…' : 'No rows.'}
      />
      {rows.length > previewLimit && (
        <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Showing the first {previewLimit} of {rows.length} rows — the export contains all of them.
        </Text>
      )}
    </Box>
  );
}
