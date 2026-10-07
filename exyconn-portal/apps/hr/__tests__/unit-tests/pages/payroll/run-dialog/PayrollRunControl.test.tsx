import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDate } from '@exyconn/i18n';
import { PayrollCandidateStatus } from '@exyconn/shell/graphql/generated';
import { PayrollRunControl } from '../../../../../src/pages/payroll/run-dialog';
import { renderWithProviders } from '../../../test-utils';
import { candidate, planOf } from './run-plan-fixture';

const gql = vi.hoisted(() => ({ plan: vi.fn(), refetch: vi.fn(), run: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePayrollRunPlanQuery: (options: unknown) => gql.plan(options),
  useRunPayrollMutation: () => [gql.run, { loading: false }],
}));

function answer(result: { data?: unknown; loading?: boolean; error?: Error }) {
  gql.plan.mockReturnValue({ loading: false, refetch: gql.refetch, ...result });
}

function renderControl() {
  const onRan = vi.fn().mockResolvedValue(undefined);
  renderWithProviders(
    <PayrollRunControl month={10} year={2026} period="October 2026" onRan={onRan} />,
  );
  return { onRan };
}

const runButton = () => screen.getByRole('button', { name: 'Run payroll' });

describe('PayrollRunControl', () => {
  beforeEach(() => {
    gql.refetch.mockReset().mockResolvedValue({});
    gql.run.mockReset();
    gql.plan.mockReset();
    answer({ data: { payrollRunPlan: planOf() } });
  });

  it("reads the month's plan fresh from the network as well as the cache", () => {
    renderControl();

    expect(gql.plan).toHaveBeenCalledWith({
      variables: { month: 10, year: 2026 },
      fetchPolicy: 'cache-and-network',
    });
    expect(runButton()).toBeEnabled();
  });

  it('cannot be pressed while the plan is loading', () => {
    answer({ loading: true });
    renderControl();

    expect(runButton()).toBeDisabled();
  });

  it('cannot be pressed when the plan could not be read, and says why', () => {
    answer({ error: new Error('Not allowed to run payroll') });
    renderControl();

    expect(runButton()).toBeDisabled();
    expect(screen.getByText('Not allowed to run payroll')).toBeInTheDocument();
  });

  it('says when a month that has not opened yet opens', () => {
    answer({ data: { payrollRunPlan: planOf(undefined, { open: false }) } });
    renderControl();
    const opens = formatDate('2026-10-25T06:00:00.000Z', DEFAULT_FORMAT_SETTINGS);

    expect(runButton()).toBeDisabled();
    expect(screen.getByText(`Payroll for October 2026 opens on ${opens}`)).toBeInTheDocument();
  });

  it('says the month is done once everybody has been run', () => {
    const plan = planOf([candidate('e2', 'Bala', PayrollCandidateStatus.AlreadyRun)]);
    answer({ data: { payrollRunPlan: plan } });
    renderControl();

    expect(runButton()).toBeDisabled();
    expect(
      screen.getByText('Payroll has already been run for every employee this month'),
    ).toBeInTheDocument();
  });

  it('opens the run dialog and closes it again', async () => {
    renderControl();

    await userEvent.click(runButton());
    expect(
      screen.getByRole('heading', { name: 'Run payroll for October 2026' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Run payroll for October 2026' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('re-reads the plan and the page once a run has issued slips', async () => {
    gql.run.mockResolvedValue({ data: { runPayroll: { generated: 2, totalNet: 76500 } } });
    const { onRan } = renderControl();

    await userEvent.click(runButton());
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(screen.getByRole('button', { name: 'Run payroll' }));

    await waitFor(() => expect(onRan).toHaveBeenCalledTimes(1));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(gql.run).toHaveBeenCalledWith({
      variables: { month: 10, year: 2026, employeeIds: ['e1', 'e3'] },
    });
  });
});
