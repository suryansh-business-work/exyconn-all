import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleSignInPanel } from '../../../../src/pages/environment-variables/GoogleSignInPanel';
import { renderWithProviders } from '../../test-utils';
import { notify, resetHarness } from './panel.harness';
import { describeSingletonPanel } from './singleton-panel.suite';

const gql = vi.hoisted(() => ({ query: vi.fn(), test: vi.fn() }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGoogleSignInConfigQuery: gql.query,
  useTestGoogleSignInConfigMutation: () => [gql.test, { loading: false }],
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: logger,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/google-sign-in-config', async () =>
  (await import('./panel.harness')).propsModule('GoogleSignInConfigForm'),
);

const config = {
  id: 'gsi-1',
  clientId: 'abc.apps.googleusercontent.com',
  hasClientSecret: true,
  clientSecretHint: null,
  enabled: true,
  redirectUri: 'https://api.example.test/oauth/google/callback',
  updatedAt: '2026-10-01T10:00:00.000Z',
  updatedByName: 'Asha',
};

describeSingletonPanel({
  name: 'GoogleSignInPanel',
  Panel: GoogleSignInPanel,
  query: gql.query,
  dataKey: 'googleSignInConfig',
  config,
  logger,
  title: 'Google sign-in',
  loadError: 'Could not load Google sign-in.',
  retryLog: 'tech: reloading Google sign-in failed',
  form: 'GoogleSignInConfigForm',
  redirectUri: config.redirectUri,
  keepsLoadedConfigOnError: false,
});

describe('GoogleSignInPanel', () => {
  const renderWith = (overrides: Partial<typeof config> = {}, error?: Error) => {
    gql.query.mockReturnValue({
      data: { googleSignInConfig: { ...config, ...overrides } },
      error,
      refetch: vi.fn(),
    });
    renderWithProviders(<GoogleSignInPanel />);
  };
  const testButton = () => screen.getByRole('button', { name: 'Test' });

  beforeEach(() => {
    resetHarness();
    gql.test.mockReset();
    logger.warn.mockReset();
  });

  it('shows the load error even over a cached config', () => {
    renderWith({}, new Error('Gateway timeout'));
    expect(screen.getByText(/Could not load Google sign-in\. Gateway timeout/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Google sign-in' })).not.toBeInTheDocument();
  });

  it('cannot test until both the client ID and a secret are saved', () => {
    renderWith({ clientId: '' });
    expect(testButton()).toBeDisabled();
  });

  it('cannot test a client ID that has no saved secret', () => {
    renderWith({ hasClientSecret: false });
    expect(testButton()).toBeDisabled();
  });

  it('reports what Google answered', async () => {
    gql.test.mockResolvedValue({ data: { testGoogleSignInConfig: 'Google knows this client' } });
    renderWith();
    expect(testButton()).toBeEnabled();
    await userEvent.click(testButton());
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Google knows this client', 'success'));
  });

  it('says Google answered when the test gives no detail', async () => {
    gql.test.mockResolvedValue({});
    renderWith();
    await userEvent.click(testButton());
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Google answered', 'success'));
  });

  it('reports and logs why the test failed', async () => {
    const failure = new Error('invalid_client');
    gql.test.mockRejectedValue(failure);
    renderWith();
    await userEvent.click(testButton());
    await waitFor(() => expect(notify).toHaveBeenCalledWith('invalid_client', 'error'));
    expect(logger.warn).toHaveBeenCalledWith('tech: testing Google sign-in failed', failure);
  });

  it('falls back to a plain failure when the error carries no message', async () => {
    gql.test.mockRejectedValue('offline');
    renderWith();
    await userEvent.click(testButton());
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('The Google sign-in test failed', 'error'),
    );
  });
});
