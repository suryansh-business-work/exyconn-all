import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { I18nProvider } from '@exyconn/i18n';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';

interface Lead {
  id: string;
  name: string;
  stage?: string | null;
  converted: boolean;
}

const rows: Lead[] = [
  { id: 'l1', name: 'Acme', stage: 'NEW', converted: false },
  { id: 'l2', name: 'Globex', stage: null, converted: true },
];

const columns: Column<Lead>[] = [
  { key: 'name', label: 'Name' },
  { key: 'stage', label: 'Stage' },
  { key: 'converted', label: 'Converted', render: (row) => (row.converted ? 'yes' : 'no') },
];

function renderTable(ui: ReactElement) {
  return render(
    <I18nProvider locale="en" messages={{ Name: 'Nombre' }}>
      {ui}
    </I18nProvider>,
  );
}

describe('DataTable rows', () => {
  it('renders translated headings, raw values, blanks and custom cells', () => {
    renderTable(<DataTable columns={columns} rows={rows} />);

    expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
    const [, acme, globex] = screen.getAllByRole('row');
    expect(
      within(acme)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['Acme', 'NEW', 'no']);
    expect(
      within(globex)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['Globex', '', 'yes']);
    expect(acme).not.toHaveAttribute('tabindex');
  });

  it('shows the empty state, translated, when there is nothing to list', () => {
    renderTable(<DataTable columns={columns} rows={[]} emptyMessage="No leads yet" />);
    expect(screen.getByText('No leads yet')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('uses the default empty message', () => {
    renderTable(<DataTable columns={columns} rows={[]} />);
    expect(screen.getByText('No records yet.')).toBeInTheDocument();
  });

  it('draws placeholder rows, with an actions cell, while loading', () => {
    renderTable(<DataTable columns={columns} rows={[]} loading onEdit={vi.fn()} />);

    expect(screen.getByRole('table').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
    const skeletons = screen.getAllByTestId('table-skeleton-row');
    expect(skeletons).toHaveLength(5);
    expect(within(skeletons[0]).getAllByRole('cell')).toHaveLength(columns.length + 1);
  });

  it('draws placeholder rows without an actions cell when there are no actions', () => {
    renderTable(<DataTable columns={columns} rows={rows} loading />);
    const skeletons = screen.getAllByTestId('table-skeleton-row');
    expect(within(skeletons[0]).getAllByRole('cell')).toHaveLength(columns.length);
  });
});

describe('DataTable row clicks', () => {
  it('opens a row by mouse, Enter and Space, but not from keys on a child', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderTable(<DataTable columns={columns} rows={rows} onRowClick={onRowClick} />);
    const acme = screen.getAllByRole('row')[1];
    expect(acme).toHaveAttribute('tabindex', '0');

    await user.click(within(acme).getByText('Acme'));
    fireEvent.keyDown(acme, { key: 'Enter' });
    fireEvent.keyDown(acme, { key: ' ' });
    fireEvent.keyDown(acme, { key: 'a' });
    fireEvent.keyDown(within(acme).getByText('Acme'), { key: 'Enter' });

    expect(onRowClick).toHaveBeenCalledTimes(3);
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
});

describe('DataTable actions', () => {
  it('runs custom actions, edit and delete without opening the row', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const convert = vi.fn();
    const actions: RowAction<Lead>[] = [
      {
        icon: <span>c</span>,
        tooltip: 'Convert',
        ariaLabel: 'convert lead',
        onClick: convert,
        hidden: (row) => row.converted,
      },
      {
        icon: <span>m</span>,
        tooltip: 'Mail',
        ariaLabel: 'mail lead',
        onClick: vi.fn(),
        color: 'primary',
      },
    ];
    renderTable(
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={onRowClick}
        onEdit={onEdit}
        onDelete={onDelete}
        actions={actions}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    const [, acme, globex] = screen.getAllByRole('row');
    expect(within(globex).queryByRole('button', { name: 'convert lead' })).not.toBeInTheDocument();
    expect(within(acme).getByRole('button', { name: 'mail lead' })).toHaveClass(
      'MuiIconButton-colorPrimary',
    );

    await user.click(within(acme).getByRole('button', { name: 'convert lead' }));
    await user.click(within(acme).getByRole('button', { name: 'edit' }));
    await user.click(within(globex).getByRole('button', { name: 'delete' }));

    expect(convert).toHaveBeenCalledWith(rows[0]);
    expect(onEdit).toHaveBeenCalledWith(rows[0]);
    expect(onDelete).toHaveBeenCalledWith(rows[1]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('shows an actions column for custom actions alone', () => {
    const actions: RowAction<Lead>[] = [
      { icon: <span>m</span>, tooltip: 'Mail', ariaLabel: 'mail lead', onClick: vi.fn() },
    ];
    renderTable(<DataTable columns={columns} rows={rows} actions={actions} />);
    expect(screen.getAllByRole('button', { name: 'mail lead' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'edit' })).not.toBeInTheDocument();
  });
});

describe('DataTable refresh', () => {
  it('re-runs the query from the refresh button, also above an empty table', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    renderTable(<DataTable columns={columns} rows={[]} onRefresh={onRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('logs a failed refresh instead of leaving an unhandled rejection', async () => {
    const user = userEvent.setup();
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('offline');
    renderTable(
      <DataTable columns={columns} rows={rows} onRefresh={() => Promise.reject(failure)} />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh table' }));
    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith('Could not refresh the table', failure),
    );
    logged.mockRestore();
  });

  it('disables refresh while the rows are loading', () => {
    renderTable(<DataTable columns={columns} rows={rows} loading onRefresh={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();
  });
});
