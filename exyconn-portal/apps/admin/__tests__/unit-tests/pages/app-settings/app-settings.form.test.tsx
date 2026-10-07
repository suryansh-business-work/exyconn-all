import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppSettingsDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { AppSettingsForm } from '../../../../src/pages/app-settings/forms/app-settings';
import { appSettings } from './app-settings.fixtures';

const mutation = vi.hoisted(() => ({
  update: vi.fn<(options: unknown) => Promise<unknown>>(),
  hook: vi.fn<(options: unknown) => unknown>(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return { ...actual, useUpdateSettingsMutation: (options: unknown) => mutation.hook(options) };
});

beforeEach(() => {
  mutation.update.mockReset();
  mutation.update.mockResolvedValue({ data: {} });
  mutation.hook.mockReset();
  mutation.hook.mockImplementation(() => [mutation.update]);
});

const preview = () => screen.getByTestId('app-settings-preview');
const retention = () => screen.getByRole('spinbutton', { name: 'Keep audit history for (days)' });
const snackbar = () => document.querySelector('.MuiSnackbar-root');

async function pick(user: ReturnType<typeof userEvent.setup>, field: RegExp, option: RegExp) {
  await user.click(screen.getByRole('combobox', { name: field }));
  await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

describe('AppSettingsForm', () => {
  it('previews now through the loaded date format, time format and zone', () => {
    renderWithProviders(<AppSettingsForm initial={appSettings()} />);
    expect(preview().textContent).toMatch(/^\d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}$/);
    expect(retention()).toHaveValue(0);
  });

  it('re-renders the preview as soon as another time format is picked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSettingsForm initial={appSettings()} />);
    await pick(user, /Time format/, /^hh:mm a/);
    expect(preview().textContent).toMatch(/\d{2}:\d{2} [AP]M$/);
  });

  it('asks for a zone once the timezone is cleared, and will not save without one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSettingsForm initial={appSettings()} />);
    await user.clear(screen.getByRole('combobox', { name: 'Timezone' }));
    expect(preview()).toHaveTextContent('Pick a date format, a time format and a timezone');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Timezone is required')).toBeInTheDocument();
    expect(mutation.update).not.toHaveBeenCalled();
  });

  it('offers English plus every enabled language as the default', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AppSettingsForm initial={appSettings({ enabledLocales: ['hi', 'not a tag'] })} />,
    );
    await user.click(screen.getByRole('combobox', { name: /Default language/ }));
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options.map((option) => option.textContent)).toContain('English (en)');
    expect(options.some((option) => option.textContent?.endsWith('(hi)'))).toBe(true);
  });

  it('refuses to save a language tag nobody can resolve', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AppSettingsForm initial={appSettings({ enabledLocales: ['hi', 'not a tag'] })} />,
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      await screen.findByText('Every language must be a tag like en, hi or pt-BR'),
    ).toBeInTheDocument();
    expect(mutation.update).not.toHaveBeenCalled();
  });

  it('rejects a retention longer than ten years', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSettingsForm initial={appSettings()} />);
    await user.clear(retention());
    await user.type(retention(), '3651');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      await screen.findByText('Enter a whole number of days, 0 to keep for ever'),
    ).toBeInTheDocument();
    expect(mutation.update).not.toHaveBeenCalled();
  });

  it('saves the settings with the retention as a number and refreshes everyone’s settings', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSettingsForm initial={appSettings()} />);
    expect(mutation.hook).toHaveBeenCalledWith({ refetchQueries: [AppSettingsDocument] });

    await user.clear(retention());
    await user.type(retention(), '30');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(snackbar()).toHaveTextContent('App settings updated'));
    expect(mutation.update).toHaveBeenCalledWith({
      variables: {
        input: {
          dateFormat: 'dd MMM yyyy',
          timeFormat: 'HH:mm',
          timezone: 'UTC',
          defaultLocale: 'en',
          enabledLocales: ['hi'],
          autoTranslate: true,
          auditRetentionDays: 30,
        },
      },
    });
    expect(retention()).toHaveValue(30);
  });

  it('says why a save failed and keeps what was typed', async () => {
    mutation.update.mockRejectedValue(new Error('Only an admin can change settings'));
    const user = userEvent.setup();
    renderWithProviders(<AppSettingsForm initial={appSettings()} />);
    await user.click(screen.getByRole('switch', { name: 'Translate new text automatically' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(snackbar()).toHaveTextContent('Only an admin can change settings'));
    expect(
      screen.getByRole('switch', { name: 'Translate new text automatically' }),
    ).not.toBeChecked();
  });

  it('puts the loaded values back on Cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSettingsForm initial={appSettings({ auditRetentionDays: 7 })} />);
    await user.clear(retention());
    await user.type(retention(), '99');
    expect(retention()).toHaveValue(99);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(retention()).toHaveValue(7);
  });
});
