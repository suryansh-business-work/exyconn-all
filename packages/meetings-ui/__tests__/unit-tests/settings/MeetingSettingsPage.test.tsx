import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useListEmployeeOptionsQuery,
  useMaSettingsQuery,
  useMaUpdateSettingsMutation,
} from '@exyconn/shell/graphql/generated';
import { MeetingSettingsPage } from '../../../src/settings/MeetingSettingsPage';
import { toSettingsValues } from '../../../src/forms/meeting-settings';
import { EMPLOYEES, makeSettings } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaSettingsQuery: vi.fn(),
  useMaUpdateSettingsMutation: vi.fn(),
  useListEmployeeOptionsQuery: vi.fn(),
}));

const update = vi.fn();

beforeEach(() => {
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useMaUpdateSettingsMutation).mockReturnValue(mutationTuple(update) as never);
  vi.mocked(useMaSettingsQuery).mockReturnValue(
    queryResult({ maSettings: makeSettings() }) as never,
  );
  vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(EMPLOYEES) as never);
});

describe('MeetingSettingsPage', () => {
  it("shows this month's spend against the budget and who saved last", () => {
    renderWithProviders(<MeetingSettingsPage />);
    expect(
      screen.getByText(/AI spend this month: \$12\.50 of \$50\.00 · Last saved by Asha Rao on/),
    ).toBeInTheDocument();
  });

  it('saves every setting, numbers as numbers', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MeetingSettingsPage />);
    const reminders = screen.getByRole('spinbutton', { name: 'Most reminders per meeting' });
    await user.clear(reminders);
    await user.type(reminders, '10');
    await user.click(screen.getByRole('combobox', { name: 'Reminder interval' }));
    await user.click(await screen.findByRole('option', { name: 'Every 2 min' }));
    await user.click(screen.getByRole('switch', { name: 'Save the call audio (WAV)' }));
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(update).toHaveBeenCalledWith({
      variables: {
        input: {
          ...toSettingsValues(makeSettings()),
          maxRemindersPerMeeting: 10,
          reminderIntervalMinutes: 2,
          saveRecordings: false,
        },
      },
    });
    expect(await screen.findByText('Meeting Assistant settings saved')).toBeInTheDocument();
  });

  it('refuses values outside the limits and keeps edits when the save fails', async () => {
    const user = userEvent.setup();
    update.mockRejectedValue(new Error('Admins only'));
    renderWithProviders(<MeetingSettingsPage />);
    const minutes = screen.getByRole('spinbutton', { name: 'Longest call recorded (minutes)' });
    fireEvent.change(minutes, { target: { value: '2000' } });
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Between 5 and 1,440 minutes')).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();

    fireEvent.change(minutes, { target: { value: '60' } });
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Admins only')).toBeInTheDocument();
    expect(minutes).toHaveValue(60);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(minutes).toHaveValue(240);
  });

  it('shows loading, a failure with Retry, and never-saved settings', async () => {
    vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(undefined) as never);
    vi.mocked(useMaSettingsQuery).mockReturnValue(
      queryResult({ maSettings: makeSettings({ updatedAt: null }) }) as never,
    );
    const first = renderWithProviders(<MeetingSettingsPage />);
    expect(screen.queryByText(/Last saved by/)).not.toBeInTheDocument();
    first.unmount();
    vi.mocked(useMaSettingsQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const second = renderWithProviders(<MeetingSettingsPage />);
    expect(screen.queryByRole('button', { name: 'Save settings' })).not.toBeInTheDocument();
    second.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaSettingsQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Settings down'), refetch }) as never,
    );
    renderWithProviders(<MeetingSettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
