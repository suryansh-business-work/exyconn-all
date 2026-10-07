import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ItSettingsForm,
  type ItSettingsRow,
} from '../../../../../../src/pages/settings/forms/it-settings';
import { renderWithProviders } from '../../../../test-utils';
import { settingsRow } from '../../../page-kit/fixtures';
import { fill, optionsOf, press } from '../../../page-kit/form-actions';

const gql = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateItSettingsMutation: () => [gql.save],
}));

const WARRANTY = 'Warn about warranties (days ahead)';

function renderForm(settings: ItSettingsRow = settingsRow()) {
  const onSaved = vi.fn();
  renderWithProviders(<ItSettingsForm settings={settings} onSaved={onSaved} />);
  return { onSaved };
}

describe('ItSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.save.mockResolvedValue({
      data: { updateItSettings: settingsRow({ warrantyWarningDays: 90 }) },
    });
  });

  it('shows the saved applications, topics and warning windows', () => {
    renderForm();

    expect(screen.getAllByText('Email')).toHaveLength(2);
    expect(screen.getByText('Slack')).toBeInTheDocument();
    expect(screen.getByText('Hardware')).toBeInTheDocument();
    expect(screen.getByLabelText(WARRANTY)).toHaveValue(60);
  });

  it('saves the settings, shows what the server kept and tells the page', async () => {
    const { onSaved } = renderForm();

    await press('Save settings');

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        input: {
          applications: ['Email', 'Slack'],
          onboardingApplications: ['Email'],
          ticketTopics: ['Hardware'],
          warrantyWarningDays: 60,
          renewalWarningDays: 30,
          certificateWarningDays: 30,
        },
      },
    });
    expect(await screen.findByText('IT settings saved')).toBeInTheDocument();
    expect(screen.getByLabelText(WARRANTY)).toHaveValue(90);
  });

  it('falls back to the standard windows when the server answers without settings', async () => {
    gql.save.mockResolvedValueOnce({ data: undefined });
    const { onSaved } = renderForm(settingsRow({ warrantyWarningDays: 120 }));

    await press('Save settings');

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText(WARRANTY)).toHaveValue(60);
    expect(screen.queryByText('Slack')).not.toBeInTheDocument();
  });

  it('offers new joiners only the applications in the list, including one just added', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText('Applications'), 'Zoom{Enter}');

    expect(screen.getByText('Zoom')).toBeInTheDocument();
    expect(await optionsOf('Given to every new joiner')).toEqual(['Email', 'Slack', 'Zoom']);
  });

  it('refuses a warning window outside one day to a year', async () => {
    renderForm();
    fill(WARRANTY, '0');

    await press('Save settings');

    expect(await screen.findByText('At least one day')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('refuses an onboarding application missing from the list', async () => {
    renderForm(settingsRow({ onboardingApplications: ['Zoom'] }));

    await press('Save settings');

    expect(await screen.findByText('Only applications from the list above')).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('shows why a save failed and keeps the page as it was', async () => {
    gql.save.mockRejectedValueOnce(new Error('Only IT admins can change this'));
    const { onSaved } = renderForm();

    await press('Save settings');

    expect(await screen.findByText('Only IT admins can change this')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('says the save failed when the error carries no message', async () => {
    gql.save.mockRejectedValueOnce('offline');
    renderForm();

    await press('Save settings');

    expect(await screen.findByText('Could not save the settings')).toBeInTheDocument();
  });

  it('puts back the saved values on cancel', async () => {
    renderForm();
    fill(WARRANTY, '45');
    expect(screen.getByLabelText(WARRANTY)).toHaveValue(45);

    await press('Cancel');

    expect(screen.getByLabelText(WARRANTY)).toHaveValue(60);
    expect(gql.save).not.toHaveBeenCalled();
  });
});
