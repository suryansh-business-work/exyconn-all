import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toCsv } from '@exyconn/shell/utils/csv';
import { ReportPanel } from '../../../../src/pages/reports/ReportPanel';
import type { AnyReport } from '../../../../src/pages/reports/reports.types';
import { renderWithProviders } from '../../test-utils';

const csv = vi.hoisted(() => ({ download: vi.fn() }));

vi.mock('@exyconn/shell/utils/csv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/csv')>()),
  downloadCsv: csv.download,
}));

const ROWS = [{ name: 'Asha' }, { name: 'Bala' }];

function report(load: AnyReport['load']): AnyReport {
  return {
    key: 'employees',
    label: 'Employees',
    description: 'Every employee with department, role and status',
    columns: [{ header: 'Name', value: (row) => (row as { name: string }).name }],
    load,
  };
}

describe('ReportPanel', () => {
  beforeEach(() => {
    csv.download.mockReset();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the report on mount and says how many rows it has', async () => {
    const load = vi.fn().mockResolvedValue(ROWS);
    renderWithProviders(<ReportPanel report={report(load)} />);

    expect(
      await screen.findByText('Every employee with department, role and status · 2 rows'),
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Bala' })).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('leaves out the row count while loading and cannot export yet', () => {
    const load = vi.fn(() => new Promise<unknown[]>(() => undefined));
    renderWithProviders(<ReportPanel report={report(load)} />);

    expect(screen.getByText('Every employee with department, role and status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('exports every row as a dated CSV and says how many', async () => {
    const load = vi.fn().mockResolvedValue(ROWS);
    renderWithProviders(<ReportPanel report={report(load)} />);
    await screen.findByRole('cell', { name: 'Asha' });

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(csv.download).toHaveBeenCalledWith(
      'employees-2026-10-07',
      toCsv(ROWS, [{ header: 'Name', value: (row: { name: string }) => row.name }]),
    );
    expect(await screen.findByText('Exported 2 rows.')).toBeInTheDocument();
  });

  it('cannot export an empty report', async () => {
    renderWithProviders(<ReportPanel report={report(vi.fn().mockResolvedValue([]))} />);

    expect(await screen.findByText('No rows.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('says why the report failed and shows no rows', async () => {
    const load = vi.fn().mockRejectedValue(new Error('Not allowed to read users'));
    renderWithProviders(<ReportPanel report={report(load)} />);

    expect(await screen.findByText('Not allowed to read users')).toBeInTheDocument();
    expect(screen.getByText('No rows.')).toBeInTheDocument();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    renderWithProviders(<ReportPanel report={report(vi.fn().mockRejectedValue('offline'))} />);

    expect(await screen.findByText('Could not load the report')).toBeInTheDocument();
  });

  it('loads the report again from the refresh button', async () => {
    const load = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(ROWS);
    renderWithProviders(<ReportPanel report={report(load)} />);
    await screen.findByText('No rows.');

    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));

    expect(await screen.findByRole('cell', { name: 'Asha' })).toBeInTheDocument();
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  });
});
