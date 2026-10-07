import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PayslipScheduleForm,
  type PayslipScheduleRow,
} from '../../../../../../src/pages/payslip-schedule/forms/payslip-schedule';
import { renderWithProviders } from '../../../../test-utils';
import { payslipSchedule } from '../../payslip-schedule-fixture';

const gql = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdatePayrollScheduleMutation: () => [gql.save],
}));

function renderForm(initial: PayslipScheduleRow = payslipSchedule()) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <PayslipScheduleForm initial={initial} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

const timeInput = () =>
  document.querySelector<HTMLInputElement>('input[name="time"]') as HTMLInputElement;
const save = () => userEvent.click(screen.getByRole('button', { name: 'Save schedule' }));

async function choose(field: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: field }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

describe('PayslipScheduleForm', () => {
  beforeEach(() => {
    gql.save.mockReset().mockResolvedValue({ data: { updatePayrollSchedule: {} } });
  });

  it('shows the stored day, time and month', () => {
    renderForm();

    expect(screen.getByRole('switch', { name: 'Email payslips automatically' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: /Day of the month/ })).toHaveTextContent('Day 3');
    expect(timeInput()).toHaveValue('09:30 AM');
    expect(screen.getByRole('combobox', { name: /Send payslips for/ })).toHaveTextContent(
      'The previous month',
    );
  });

  it('saves the schedule as an hour and a minute and says it is on', async () => {
    const { onDone } = renderForm();

    await save();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        input: { enabled: true, dayOfMonth: 3, period: 'PREVIOUS_MONTH', hour: 9, minute: 30 },
      },
    });
    expect(await screen.findByText('Payslip emails are scheduled')).toBeInTheDocument();
  });

  it('saves a changed day, time and month, and says the emails are off', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('switch', { name: 'Email payslips automatically' }));
    await choose(/Day of the month/, 'Day 28');
    fireEvent.change(timeInput(), { target: { value: '06:05 PM' } });
    await choose(/Send payslips for/, 'The current month');
    await save();

    await waitFor(() => expect(gql.save).toHaveBeenCalledTimes(1));
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        input: { enabled: false, dayOfMonth: 28, period: 'CURRENT_MONTH', hour: 18, minute: 5 },
      },
    });
    expect(await screen.findByText('Scheduled payslip emails are off')).toBeInTheDocument();
  });

  it('offers days 1 to 28 only, so every month has the day', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('combobox', { name: /Day of the month/ }));
    const days = within(screen.getByRole('listbox')).getAllByRole('option');

    expect(days).toHaveLength(28);
    expect(days[0]).toHaveTextContent('Day 1');
    expect(days[27]).toHaveTextContent('Day 28');
  });

  it('asks for a time once the time is cleared', async () => {
    renderForm();

    fireEvent.change(timeInput(), { target: { value: '' } });
    await save();

    expect(await screen.findByText('Pick a time')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('refuses a stored day past the 28th and a month it does not know', async () => {
    renderForm(payslipSchedule({ dayOfMonth: 31, period: 'WEEKLY' }));

    await save();

    expect(
      await screen.findByText('The latest is the 28th, so every month has it'),
    ).toBeInTheDocument();
    expect(screen.getByText('Choose which month is sent')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it("reports the server's reason and does not close", async () => {
    gql.save.mockRejectedValue(new Error('Schedule is locked'));
    const { onDone } = renderForm();

    await save();

    expect(await screen.findByText('Schedule is locked')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.save.mockRejectedValue('offline');
    renderForm();

    await save();

    expect(await screen.findByText('Could not save the schedule')).toBeInTheDocument();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.save).not.toHaveBeenCalled();
  });
});
