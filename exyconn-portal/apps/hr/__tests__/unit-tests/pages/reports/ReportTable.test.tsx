import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CsvColumn } from '@exyconn/shell/utils/csv';
import { ReportTable } from '../../../../src/pages/reports/ReportTable';
import { renderWithProviders } from '../../test-utils';

interface Row {
  name: string;
  note: unknown;
}

const COLUMNS = [
  { header: 'Name', value: (row: Row) => row.name },
  { header: 'Note', value: (row: Row) => row.note },
] as CsvColumn<unknown>[];

const ROWS: Row[] = [
  { name: 'Asha', note: 'On site' },
  { name: 'Bala', note: 0 },
  { name: 'Chen', note: null },
];

function renderTable(
  rows: unknown[] = ROWS,
  options: { loading?: boolean; previewLimit?: number } = {},
) {
  const onRefresh = vi.fn().mockResolvedValue(undefined);
  renderWithProviders(
    <ReportTable
      columns={COLUMNS}
      rows={rows}
      loading={options.loading ?? false}
      onRefresh={onRefresh}
      previewLimit={options.previewLimit ?? 50}
    />,
  );
  return { onRefresh };
}

describe('ReportTable', () => {
  it('renders each row through the same columns the CSV uses', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Note' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'On site' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '0' })).toBeInTheDocument();
  });

  it('writes a dash for a missing or blank value', () => {
    renderTable([
      { name: 'Chen', note: null },
      { name: 'Dev', note: undefined },
      { name: 'Ema', note: '' },
    ]);

    expect(screen.getAllByRole('cell', { name: '—' })).toHaveLength(3);
  });

  it('previews only the first rows and says the export has the rest', () => {
    renderTable(ROWS, { previewLimit: 2 });

    expect(screen.getByRole('cell', { name: 'Bala' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Chen' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Showing the first 2 of 3 rows — the export contains all of them.'),
    ).toBeInTheDocument();
  });

  it('says nothing about a preview when every row fits', () => {
    renderTable(ROWS, { previewLimit: 3 });

    expect(screen.queryByText(/Showing the first/)).not.toBeInTheDocument();
  });

  it('says there are no rows', () => {
    renderTable([]);

    expect(screen.getByText('No rows.')).toBeInTheDocument();
  });

  it('re-loads the report from its refresh button', async () => {
    const { onRefresh } = renderTable();

    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('locks the refresh while the rows are loading', () => {
    renderTable(ROWS, { loading: true });

    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();
    expect(screen.queryByRole('cell', { name: 'Asha' })).not.toBeInTheDocument();
  });
});
