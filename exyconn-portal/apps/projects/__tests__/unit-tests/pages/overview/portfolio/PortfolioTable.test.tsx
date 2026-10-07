import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortfolioTable, type PortfolioRow } from '../../../../../src/pages/overview/portfolio';
import { renderWithProviders } from '../../../test-utils';
import { portfolioRow } from '../../../fixtures';
import { UrlProbe } from '../../../helpers/form-stub';

interface TableColumn {
  key: string;
  label: string;
  render: (row: PortfolioRow) => ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  rows: PortfolioRow[];
  emptyMessage: string;
  loading: boolean;
  onRefresh?: () => unknown;
  onRowClick: (row: PortfolioRow) => void;
}

const recorded = vi.hoisted(() => ({ table: null as unknown }));

/** Renders each row cell by cell, as the shared table does, and a row as a clickable button. */
vi.mock('@exyconn/shell/components/data/DataTable', () => ({
  DataTable: (props: Readonly<TableProps>) => {
    recorded.table = props;
    return (
      <ul>
        {props.rows.map((row) => (
          <li key={row.id} aria-label={row.name}>
            {props.columns.map((column) => (
              <div key={column.key}>{column.render(row)}</div>
            ))}
            <button type="button" onClick={() => props.onRowClick(row)}>
              {`Open ${row.name}`}
            </button>
          </li>
        ))}
      </ul>
    );
  },
}));

const table = () => recorded.table as TableProps;

describe('PortfolioTable', () => {
  it('shows the six columns of evidence beside every project, in the order given', () => {
    renderWithProviders(
      <PortfolioTable rows={[portfolioRow(), portfolioRow({ id: 'p2', name: 'Billing' })]} />,
    );

    expect(table().columns.map((column) => column.label)).toEqual([
      'Project',
      'Risk',
      'Timeline',
      'Progress',
      'Open bugs',
      'Hours',
    ]);
    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('aria-label'))).toEqual([
      'Website Redesign',
      'Billing',
    ]);
    const first = within(screen.getByRole('listitem', { name: 'Website Redesign' }));
    expect(first.getByText('At risk')).toBeInTheDocument();
    expect(first.getByText('Overdue')).toBeInTheDocument();
    expect(first.getByText('40%')).toBeInTheDocument();
    expect(first.getByText('3')).toBeInTheDocument();
    expect(first.getByText('130 of 100 h')).toBeInTheDocument();
  });

  it('is not loading by default and says so plainly when there is nothing to report', () => {
    renderWithProviders(<PortfolioTable rows={[]} />);

    expect(table().loading).toBe(false);
    expect(table().emptyMessage).toBe('No projects to report on yet.');
    expect(table().onRefresh).toBeUndefined();
  });

  it('passes the loading flag and the refresh through', () => {
    const onRefresh = vi.fn().mockResolvedValue({});
    renderWithProviders(<PortfolioTable rows={[]} loading onRefresh={onRefresh} />);

    expect(table().loading).toBe(true);
    expect(table().onRefresh).toBe(onRefresh);
  });

  it('opens a project on its health tab when its row is clicked', async () => {
    renderWithProviders(
      <>
        <PortfolioTable rows={[portfolioRow({ id: 'p9' })]} />
        <UrlProbe />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open Website Redesign' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent('/projects/p9/health');
  });
});
