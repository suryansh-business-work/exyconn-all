import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerSettingsForm } from '../../../../../../src/pages/tracker/forms/tracker-settings';
import { toInitial } from '../../../../../../src/pages/tracker/forms/tracker-settings/tracker-settings.schema';
import { renderWithProviders } from '../../../../test-utils';
import { settingsRow } from '../../tracker.fixtures';
import { POLICIES, field } from './settings.harness';

const gql = vi.hoisted(() => ({ update: vi.fn(), policies: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateTrackerSettingsMutation: () => [gql.update],
  useMyPoliciesQuery: gql.policies,
}));
vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) =>
  (await import('./settings.harness')).rhfModuleMock(importOriginal),
);

const toast = () => screen.findByRole('alert', { hidden: true });
const save = () => userEvent.click(screen.getByRole('button', { name: 'Update' }));
const timezone = () => screen.getByRole('combobox', { name: 'Default timezone' });
const cornerSelect = () => screen.queryByRole('combobox', { name: /Webcam photo corner/ });

describe('TrackerSettingsForm', () => {
  beforeEach(() => {
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.policies.mockReset().mockReturnValue({ data: { myPolicies: POLICIES } });
  });

  it('opens on the saved capture numbers and the saved default timezone', () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    expect(field('Interval (minutes)')).toHaveValue(10);
    expect(field('Screenshots / interval')).toHaveValue(1);
    expect(field('Idle threshold (s)')).toHaveValue(300);
    expect(field('Pause after idle (minutes)')).toHaveValue(15);
    expect(field('Screenshot max width')).toHaveValue(1280);
    expect(field('Screenshot quality (%)')).toHaveValue(60);
    expect(field('Delete screenshots after (days)')).toHaveValue(0);
    expect(field('Auto-sync every (minutes)')).toHaveValue(5);
    expect(field('Randomize screenshot timing')).toBeChecked();
    expect(field('Blur screenshots')).not.toBeChecked();
    expect(field('Track window titles')).toBeChecked();
    expect(timezone()).toHaveValue('Asia/Kolkata (UTC+05:30)');
  });

  it('offers the webcam corner only once a photo is being taken', async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    expect(cornerSelect()).not.toBeInTheDocument();
    await userEvent.click(field('Webcam photo with each screenshot'));
    expect(cornerSelect()).toBeInTheDocument();
    expect(screen.getByText('Where the photo sits on the screenshot.')).toBeInTheDocument();
  });

  it('shows the saved corner when the webcam is already on', () => {
    renderWithProviders(
      <TrackerSettingsForm
        initial={settingsRow({ webcamEnabled: true, webcamCorner: 'top-left' })}
      />,
    );
    expect(cornerSelect()).toHaveTextContent('Top left');
  });

  it('saves every setting, as numbers, and says so', async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    fireEvent.change(field('Interval (minutes)'), { target: { value: '15' } });
    await save();
    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: { input: { ...toInitial(settingsRow()), intervalMinutes: 15 } },
    });
    expect(await toast()).toHaveTextContent('Tracker settings saved');
    expect(field('Interval (minutes)')).toHaveValue(15);
  });

  it("reads a cleared default as each device's own timezone", async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    await userEvent.clear(timezone());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(timezone()).toHaveValue("Use each device's own timezone"));
    await save();
    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input.defaultTimezone).toBe('');
  });

  it('refuses a capture interval outside the schema and saves nothing', async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    fireEvent.change(field('Interval (minutes)'), { target: { value: '99' } });
    await save();
    await waitFor(() =>
      expect(field('Interval (minutes)')).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('says why a save failed', async () => {
    gql.update.mockRejectedValue(new Error('Only admins can change tracker settings'));
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    await save();
    expect(await toast()).toHaveTextContent('Only admins can change tracker settings');
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.update.mockRejectedValue('offline');
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    await save();
    expect(await toast()).toHaveTextContent('Save failed');
  });

  it('puts the saved values back on Cancel', async () => {
    renderWithProviders(<TrackerSettingsForm initial={settingsRow()} />);
    fireEvent.change(field('Screenshot quality (%)'), { target: { value: '90' } });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(field('Screenshot quality (%)')).toHaveValue(60));
    expect(gql.update).not.toHaveBeenCalled();
  });
});
