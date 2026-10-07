import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { PayslipSchedulePage } from '../../../../src/pages/payslip-schedule';
import { renderWithProviders } from '../../test-utils';
import { payslipSchedule } from './payslip-schedule-fixture';

const gql = vi.hoisted(() => ({ schedule: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePayrollScheduleQuery: (options: unknown) => gql.schedule(options),
}));

vi.mock('../../../../src/pages/payslip-schedule/forms/payslip-schedule', async () => ({
  PayslipScheduleForm: (await import('../../harness/form-stub')).FormStub,
}));

function answer(result: { data?: unknown; loading?: boolean; error?: Error }) {
  gql.schedule.mockReturnValue({ loading: false, refetch: gql.refetch, ...result });
}

/** The value written beside one detail label. */
const detail = (label: string) => screen.getByText(label).nextElementSibling?.textContent ?? '';

describe('PayslipSchedulePage', () => {
  beforeEach(() => {
    gql.refetch.mockReset().mockResolvedValue({});
    gql.schedule.mockReset();
    answer({ data: { payrollSchedule: payslipSchedule() } });
  });

  it('reads the schedule fresh and says which timezone its times are in', () => {
    renderWithProviders(<PayslipSchedulePage />);

    expect(gql.schedule).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'Payslip Schedule' })).toBeInTheDocument();
    expect(screen.getByText('When payslips are emailed, in UTC')).toBeInTheDocument();
  });

  it('shows a spinner until the schedule first arrives', () => {
    answer({ loading: true });
    renderWithProviders(<PayslipSchedulePage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Last scheduled run')).not.toBeInTheDocument();
  });

  it('says why the schedule could not be read', () => {
    answer({ error: new Error('Not allowed to read the schedule') });
    renderWithProviders(<PayslipSchedulePage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed to read the schedule');
  });

  it('keeps the loaded schedule on screen while it refreshes', () => {
    answer({ data: { payrollSchedule: payslipSchedule() }, loading: true });
    renderWithProviders(<PayslipSchedulePage />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Last scheduled run')).toBeInTheDocument();
  });

  it('opens the form on the stored schedule and reports what the last run did', () => {
    renderWithProviders(<PayslipSchedulePage />);

    expect(screen.getByText(/^Form for /)).toHaveTextContent('"dayOfMonth":3');
    expect(detail('Last run')).toBe(format(new Date('2026-10-03T04:00:00.000Z'), 'PPpp'));
    expect(detail('Sent for')).toBe('2026-09');
    expect(detail('Emailed')).toBe('41');
    expect(detail('Failed')).toBe('2');
    expect(detail('No email address')).toBe('1');
  });

  it('says no scheduled run has happened yet', () => {
    answer({ data: { payrollSchedule: payslipSchedule({ lastRunAt: null }) } });
    renderWithProviders(<PayslipSchedulePage />);

    expect(screen.getByText('No scheduled run has happened yet.')).toBeInTheDocument();
    expect(screen.queryByText('Last run')).not.toBeInTheDocument();
  });

  it('re-reads the schedule after a save and after a cancel', async () => {
    renderWithProviders(<PayslipSchedulePage />);

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    expect(gql.refetch).toHaveBeenCalledTimes(2);
  });

  it('stays put when the re-read fails', async () => {
    gql.refetch.mockRejectedValue(new Error('offline'));
    renderWithProviders(<PayslipSchedulePage />);

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Last scheduled run')).toBeInTheDocument();
  });
});
