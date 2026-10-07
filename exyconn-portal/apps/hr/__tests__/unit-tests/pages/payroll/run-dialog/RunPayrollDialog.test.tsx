import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RunPayrollDialog } from '../../../../../src/pages/payroll/run-dialog/RunPayrollDialog';
import { renderWithProviders } from '../../../test-utils';
import { planOf } from './run-plan-fixture';

const gql = vi.hoisted(() => ({ run: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRunPayrollMutation: () => [gql.run, { loading: gql.loading }],
}));

function renderDialog() {
  const onClose = vi.fn();
  const onRan = vi.fn().mockResolvedValue(undefined);
  renderWithProviders(
    <RunPayrollDialog plan={planOf()} period="October 2026" onClose={onClose} onRan={onRan} />,
  );
  return { onClose, onRan };
}

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('RunPayrollDialog', () => {
  beforeEach(() => {
    gql.run.mockReset();
    gql.loading = false;
  });

  it('opens on the pick step with the counts and every ready employee ticked', () => {
    renderDialog();

    expect(
      screen.getByRole('heading', { name: 'Run payroll for October 2026' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('2 ready · 1 already run · 1 without a salary structure'),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Run payroll for Asha' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Run payroll for Chitra' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Selected2');
  });

  it('narrows the list to the names that match the search, ignoring case and spaces', async () => {
    renderDialog();

    await userEvent.type(screen.getByLabelText('Search by name'), '  CHI ');

    expect(screen.getByText('Chitra')).toBeInTheDocument();
    expect(screen.queryByText('Asha')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Selected2');
  });

  it('cannot continue once every employee is unticked', async () => {
    renderDialog();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select every ready employee' }));

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('confirms, then runs the month for exactly the employees still ticked', async () => {
    gql.run.mockResolvedValue({ data: { runPayroll: { generated: 1, totalNet: 29000 } } });
    const { onClose, onRan } = renderDialog();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Run payroll for Asha' }));
    await click('Continue');
    expect(
      screen.getByRole('heading', { name: 'Confirm the run for October 2026' }),
    ).toBeInTheDocument();
    await click('Run payroll');

    await waitFor(() => expect(onRan).toHaveBeenCalledTimes(1));
    expect(gql.run).toHaveBeenCalledWith({
      variables: { month: 10, year: 2026, employeeIds: ['e3'] },
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Generated 1 salary slips')).toBeInTheDocument();
  });

  it('says none were generated when the run returns no result', async () => {
    gql.run.mockResolvedValue({ data: null });
    renderDialog();

    await click('Continue');
    await click('Run payroll');

    expect(await screen.findByText('Generated 0 salary slips')).toBeInTheDocument();
  });

  it('goes back from the confirmation to the pick step', async () => {
    renderDialog();

    await click('Continue');
    await click('Back');

    expect(
      screen.getByRole('heading', { name: 'Run payroll for October 2026' }),
    ).toBeInTheDocument();
    expect(gql.run).not.toHaveBeenCalled();
  });

  it('reports a failed run and stays open', async () => {
    gql.run.mockRejectedValue(new Error('Payroll is already running'));
    const { onClose, onRan } = renderDialog();

    await click('Continue');
    await click('Run payroll');

    expect(await screen.findByText('Payroll is already running')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onRan).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.run.mockRejectedValue('offline');
    renderDialog();

    await click('Continue');
    await click('Run payroll');

    expect(await screen.findByText('Payroll run failed')).toBeInTheDocument();
  });

  it('cancels from the pick step', async () => {
    const { onClose } = renderDialog();

    await click('Cancel');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cannot be dismissed or sent back while the run is in flight', async () => {
    gql.loading = true;
    const { onClose } = renderDialog();

    await click('Continue');
    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape when nothing is running', async () => {
    const { onClose } = renderDialog();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
