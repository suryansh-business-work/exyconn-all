import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { AppSettingsDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { AppSettingsPage } from '../../../../src/pages/app-settings';
import { appSettings } from './app-settings.fixtures';

describe('AppSettingsPage', () => {
  it('says it is loading, then shows the form filled with the saved settings', async () => {
    renderWithProviders(<AppSettingsPage />, {
      mocks: [
        {
          request: { query: AppSettingsDocument },
          result: { data: { appSettings: appSettings({ auditRetentionDays: 30 }) } },
        },
      ],
    });
    expect(screen.getByRole('heading', { name: 'App Settings' })).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    expect(
      await screen.findByRole('spinbutton', { name: 'Keep audit history for (days)' }),
    ).toHaveValue(30);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('says the settings are unavailable when they cannot be read', async () => {
    renderWithProviders(<AppSettingsPage />, {
      mocks: [{ request: { query: AppSettingsDocument }, error: new Error('Forbidden') }],
    });
    expect(await screen.findByText('App settings are unavailable.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
  });
});
