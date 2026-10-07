import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '../../../../src/pages/settings';
import { renderWithProviders } from '../../test-utils';
import { settingsRow } from '../page-kit/fixtures';

const gql = vi.hoisted(() => ({ settings: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useItSettingsQuery: (options: unknown) => gql.settings(options),
}));

vi.mock('../../../../src/pages/settings/forms/it-settings', () => ({
  ItSettingsForm: ({
    settings,
    onSaved,
  }: Readonly<{ settings: { id: string }; onSaved: () => void }>) => (
    <button type="button" onClick={onSaved}>{`Save ${settings.id}`}</button>
  ),
}));

vi.mock('../../../../src/pages/settings/OwnedSettingsLinks', () => ({
  OwnedSettingsLinks: () => <p>Settings owned elsewhere</p>,
}));

function answer(extra: Record<string, unknown> = {}) {
  return {
    data: { itSettings: settingsRow() },
    loading: false,
    error: undefined,
    refetch: gql.refetch,
    ...extra,
  };
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.settings.mockReturnValue(answer());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the settings fresh and hands them to the form', () => {
    renderWithProviders(<SettingsPage />);

    expect(gql.settings).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'IT Admin Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save settings-1' })).toBeInTheDocument();
    expect(screen.getByText('Settings owned elsewhere')).toBeInTheDocument();
  });

  it('shows loading until the settings arrive', () => {
    gql.settings.mockReturnValue(answer({ data: undefined, loading: true }));
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('keeps showing loading while a failed read is retried', () => {
    gql.settings.mockReturnValue(
      answer({ data: undefined, loading: true, error: new Error('Offline') }),
    );
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  it('shows the error once the read has failed', () => {
    gql.settings.mockReturnValue(answer({ data: undefined, error: new Error('Offline') }));
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('reloads the settings after they are saved', async () => {
    renderWithProviders(<SettingsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Save settings-1' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a reload that fails after a save', async () => {
    const failure = new Error('Reload failed');
    gql.refetch.mockRejectedValueOnce(failure);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(<SettingsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Save settings-1' }));

    await waitFor(() => expect(log).toHaveBeenCalledWith('Could not reload settings', failure));
  });
});
