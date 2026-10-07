import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayrollCandidateStatus } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { CandidateTable } from '../../../../../src/pages/payroll/run-dialog/CandidateTable';
import type { Candidate } from '../../../../../src/pages/payroll/run-dialog/runPlan';
import { renderWithProviders } from '../../../test-utils';
import { EMPLOYEES, candidate } from './run-plan-fixture';

interface Options {
  rows?: Candidate[];
  picked?: string[];
  allPicked?: boolean;
  somePicked?: boolean;
  readyCount?: number;
}

function renderTable({
  rows = EMPLOYEES,
  picked = ['e1', 'e3', 'e4'],
  allPicked = true,
  somePicked = false,
  readyCount = 2,
}: Options = {}) {
  const onToggle = vi.fn();
  const onToggleAll = vi.fn();
  renderWithProviders(
    <CandidateTable
      rows={rows}
      isPicked={(id) => picked.includes(id)}
      onToggle={onToggle}
      onToggleAll={onToggleAll}
      allPicked={allPicked}
      somePicked={somePicked}
      readyCount={readyCount}
    />,
  );
  return { onToggle, onToggleAll };
}

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

describe('CandidateTable', () => {
  it('shows a ready employee with their role, a ticked box and the worked-out figures', () => {
    renderTable();
    const asha = within(rowOf('Asha'));

    expect(asha.getByRole('checkbox', { name: 'Run payroll for Asha' })).toBeChecked();
    expect(asha.getByText('Engineer · Engineering')).toBeInTheDocument();
    expect(asha.getByText('READY')).toBeInTheDocument();
    expect(asha.getByText(formatMoney(50000, 'INR'))).toBeInTheDocument();
    expect(asha.getByText(formatMoney(2500, 'INR'))).toBeInTheDocument();
    expect(asha.getByText(formatMoney(47500, 'INR'))).toBeInTheDocument();
  });

  it('shows an already-run employee with the status of their slip, and no box to tick', () => {
    renderTable();
    const bala = within(rowOf('Bala'));

    expect(bala.getByText('Already run')).toBeInTheDocument();
    expect(bala.getByText('GENERATED')).toBeInTheDocument();
    expect(bala.getByRole('checkbox', { name: 'Run payroll for Bala' })).toBeDisabled();
    expect(bala.getAllByText('—')).toHaveLength(3);
  });

  it('says an already-run slip is run even when its status is unknown', () => {
    const run = { ...candidate('e2', 'Bala', PayrollCandidateStatus.AlreadyRun), slipStatus: null };
    renderTable({ rows: [run] });

    expect(screen.getByText('Already run')).toBeInTheDocument();
    expect(screen.queryByText('GENERATED')).not.toBeInTheDocument();
  });

  it('links an employee with no salary structure to Salaries, never ticked', () => {
    renderTable();
    const dev = within(rowOf('Dev'));

    expect(dev.getByText('No salary structure')).toBeInTheDocument();
    expect(dev.getByRole('link', { name: 'Set one up in Salaries' })).toHaveAttribute(
      'href',
      '/hr/salaries',
    );
    expect(dev.getByRole('checkbox', { name: 'Run payroll for Dev' })).not.toBeChecked();
  });

  it('leaves out the role line for somebody with neither title nor department', () => {
    const bare = { ...EMPLOYEES[0], designation: null, department: null };
    renderTable({ rows: [bare] });

    expect(screen.queryByText(/Engineer/)).not.toBeInTheDocument();
  });

  it('hands the employee id back when a box is ticked', async () => {
    const { onToggle } = renderTable({ picked: [] });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Run payroll for Chitra' }));

    expect(onToggle).toHaveBeenCalledWith('e3');
  });

  it('ticks or clears every ready employee from the header box', async () => {
    const { onToggleAll } = renderTable({ allPicked: false, somePicked: true });
    const all = screen.getByRole('checkbox', { name: 'Select every ready employee' });

    expect(all).toHaveAttribute('data-indeterminate', 'true');
    await userEvent.click(all);

    expect(onToggleAll).toHaveBeenCalledTimes(1);
  });

  it('disables the header box when nobody is ready', () => {
    renderTable({ readyCount: 0, allPicked: false });

    expect(screen.getByRole('checkbox', { name: 'Select every ready employee' })).toBeDisabled();
  });

  it('says so when the search matches nobody', () => {
    renderTable({ rows: [] });

    expect(screen.getByText('No employee matches that search.')).toBeInTheDocument();
  });
});
