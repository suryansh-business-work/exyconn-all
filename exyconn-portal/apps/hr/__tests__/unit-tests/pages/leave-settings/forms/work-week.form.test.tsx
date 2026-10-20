import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSetDefaultWorkDaysMutation } from '@exyconn/shell/graphql/generated';
import { WorkWeekForm } from '../../../../../src/pages/leave-settings/forms/work-week';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../../harness/gql-doubles';
import { press } from '../../../harness/form-fields';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetDefaultWorkDaysMutation: vi.fn(),
}));

const save = vi.fn();
const day = (name: string) => screen.getByRole('button', { name });

function renderForm(defaultWorkDays: number[] = [1, 2, 3, 4, 5]) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <WorkWeekForm
      initial={{ __typename: 'WorkWeek', defaultWorkDays }}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );
  return { onDone, onCancel };
}

describe('WorkWeekForm', () => {
  beforeEach(() => {
    save.mockReset().mockResolvedValue({ data: { setDefaultWorkDays: { defaultWorkDays: [] } } });
    vi.mocked(useSetDefaultWorkDaysMutation).mockReturnValue(mutationTuple(save) as never);
  });

  it('opens on the saved week, Monday first, each day a toggle', () => {
    renderForm();
    const group = screen.getByRole('group', { name: 'Work days' });
    const names = within(group)
      .getAllByRole('button')
      .map((chip) => chip.textContent);
    expect(names).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
    expect(day('Monday')).toHaveAttribute('aria-pressed', 'true');
    expect(day('Friday')).toHaveAttribute('aria-pressed', 'true');
    expect(day('Saturday')).toHaveAttribute('aria-pressed', 'false');
    expect(day('Sunday')).toHaveAttribute('aria-pressed', 'false');
  });

  it('saves the week with a day added, in week order, and says so', async () => {
    const { onDone } = renderForm();
    await userEvent.click(day('Saturday'));
    expect(day('Saturday')).toHaveAttribute('aria-pressed', 'true');
    await press('Save work week');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith({ variables: { days: [1, 2, 3, 4, 5, 6] } });
    expect(await screen.findByText('Work week saved')).toBeInTheDocument();
  });

  it('saves a week with Sunday in it and a weekday taken out', async () => {
    renderForm();
    await userEvent.click(day('Friday'));
    await userEvent.click(day('Sunday'));
    await press('Save work week');

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith({ variables: { days: [1, 2, 3, 4, 0] } });
  });

  it('saves all seven days', async () => {
    renderForm([1, 2, 3, 4, 5, 6]);
    await userEvent.click(day('Sunday'));
    await press('Save work week');

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith({ variables: { days: [1, 2, 3, 4, 5, 6, 0] } });
  });

  it('refuses a week with no working day', async () => {
    const { onDone } = renderForm([3]);
    await userEvent.click(day('Wednesday'));
    await press('Save work week');

    expect(await screen.findByText('Pick at least one working day')).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('clears the error once a day is picked again', async () => {
    renderForm([3]);
    await userEvent.click(day('Wednesday'));
    await press('Save work week');
    expect(await screen.findByText('Pick at least one working day')).toBeInTheDocument();

    await userEvent.click(day('Thursday'));
    await waitFor(() => expect(screen.queryByText('Pick at least one working day')).toBeNull());
  });

  it('shows the server error and stays open when saving fails', async () => {
    save.mockRejectedValue(new Error('Only HR admins can change the work week'));
    const { onDone } = renderForm();
    await press('Save work week');

    expect(await screen.findByText('Only HR admins can change the work week')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an error', async () => {
    save.mockRejectedValue('network down');
    renderForm();
    await press('Save work week');

    expect(await screen.findByText('Could not save the work week')).toBeInTheDocument();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
  });
});
