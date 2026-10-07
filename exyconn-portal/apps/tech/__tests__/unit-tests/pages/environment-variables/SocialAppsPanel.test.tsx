import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialAppsPanel } from '../../../../src/pages/environment-variables/SocialAppsPanel';
import { renderWithProviders } from '../../test-utils';
import { forms, notify, resetHarness, table } from './panel.harness';

const gql = vi.hoisted(() => ({ list: vi.fn(), test: vi.fn(), refetch: vi.fn() }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSocialAppConfigsQuery: gql.list,
  useTestSocialAppConfigMutation: () => [gql.test],
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: logger,
}));
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/social-app', async () =>
  (await import('./panel.harness')).formModule('SocialAppForm'),
);

const app = (id: string, label: string, clientId: string, hasClientSecret: boolean) => ({
  id,
  app: id.toUpperCase(),
  label,
  consoleUrl: `https://${id}.example.test/apps`,
  callbackUrl: `https://api.example.test/oauth/${id}`,
  clientId,
  hasClientSecret,
  clientSecretHint: hasClientSecret ? 'zz99' : null,
  enabled: hasClientSecret && clientId !== '',
});

const ROWS = [
  app('linkedin', 'LinkedIn', 'li-client', true),
  app('meta', 'Meta', '', true),
  app('x', 'X', 'x-client', false),
];

const TEST = 'test social app connection';

describe('SocialAppsPanel', () => {
  beforeEach(() => {
    resetHarness();
    gql.test.mockReset();
    gql.refetch.mockReset();
    logger.error.mockReset();
    logger.warn.mockReset();
    gql.list.mockReturnValue({
      data: { socialAppConfigs: ROWS },
      loading: false,
      refetch: gql.refetch,
    });
  });

  const rowOf = (id: string) => within(screen.getByTestId(`row-${id}`));

  it('lists each provider with its client id, masked secret and status', () => {
    renderWithProviders(<SocialAppsPanel />);
    expect(screen.getByRole('heading', { level: 1, name: 'Social apps' })).toBeInTheDocument();
    expect(rowOf('linkedin').getByText('li-client')).toBeInTheDocument();
    expect(rowOf('linkedin').getByText('••••zz99')).toBeInTheDocument();
    expect(rowOf('linkedin').getByText('ACTIVE')).toBeInTheDocument();
    expect(rowOf('meta').getByText('—')).toBeInTheDocument();
    expect(rowOf('x').getAllByText('—')).toHaveLength(1);
    expect(rowOf('x').getByText('INACTIVE')).toBeInTheDocument();
    expect(table.props?.onRefresh).toBe(gql.refetch);
  });

  it('offers a test only once both the client id and the secret are stored', () => {
    renderWithProviders(<SocialAppsPanel />);
    expect(rowOf('linkedin').getByRole('button', { name: TEST })).toBeInTheDocument();
    expect(rowOf('meta').queryByRole('button', { name: TEST })).not.toBeInTheDocument();
    expect(rowOf('x').queryByRole('button', { name: TEST })).not.toBeInTheDocument();
  });

  it('shows an empty list before the providers answer', () => {
    gql.list.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    renderWithProviders(<SocialAppsPanel />);
    expect(screen.getByText('No providers.')).toBeInTheDocument();
    expect(table.props?.loading).toBe(true);
  });

  it.each([
    [true, 'LinkedIn accepted the app.', 'success'],
    [false, 'LinkedIn rejected the secret.', 'error'],
  ])('reports the provider verdict (ok: %s)', async (ok, message, severity) => {
    gql.test.mockResolvedValue({ data: { testSocialAppConfig: { ok, message } } });
    renderWithProviders(<SocialAppsPanel />);
    await userEvent.click(rowOf('linkedin').getByRole('button', { name: TEST }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(message, severity));
    expect(gql.test).toHaveBeenCalledWith({ variables: { app: 'LINKEDIN' } });
  });

  it('says the provider did not answer when the test returns nothing', async () => {
    gql.test.mockResolvedValue({ data: null });
    renderWithProviders(<SocialAppsPanel />);
    await userEvent.click(rowOf('linkedin').getByRole('button', { name: TEST }));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('No answer from the provider', 'error'),
    );
  });

  it.each([
    [new Error('Provider unreachable'), 'Provider unreachable'],
    ['boom', 'The test could not run'],
  ])('reports a test that could not run (%s)', async (failure, message) => {
    gql.test.mockRejectedValue(failure);
    renderWithProviders(<SocialAppsPanel />);
    await userEvent.click(rowOf('linkedin').getByRole('button', { name: TEST }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(message, 'error'));
  });

  it('logs the failure when even the notification cannot be shown', async () => {
    const failure = new Error('snackbar gone');
    notify.mockImplementation(() => {
      throw failure;
    });
    gql.test.mockResolvedValue({ data: { testSocialAppConfig: { ok: true, message: 'ok' } } });
    renderWithProviders(<SocialAppsPanel />);
    await userEvent.click(rowOf('linkedin').getByRole('button', { name: TEST }));
    await waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith('Testing a social app failed', failure),
    );
  });

  it('sets a provider up on its own page and goes back without saving', async () => {
    renderWithProviders(<SocialAppsPanel />);
    await userEvent.click(rowOf('meta').getByRole('button', { name: 'set up social app' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Set up Meta' })).toBeInTheDocument();
    expect(forms.SocialAppForm?.row).toBe(ROWS[1]);
    await userEvent.click(screen.getByRole('button', { name: 'stub cancel' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Social apps' })).toBeInTheDocument();

    await userEvent.click(rowOf('meta').getByRole('button', { name: 'set up social app' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back to Social apps' }));
    expect(screen.queryByTestId('SocialAppForm')).not.toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('reloads the providers after a save', async () => {
    gql.refetch.mockResolvedValue({});
    renderWithProviders(<SocialAppsPanel />);
    await userEvent.click(rowOf('x').getByRole('button', { name: 'set up social app' }));
    await userEvent.click(screen.getByRole('button', { name: 'stub done' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Social apps' })).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a reload that fails after a save', async () => {
    const failure = new Error('network down');
    gql.refetch.mockRejectedValue(failure);
    renderWithProviders(<SocialAppsPanel />);
    await userEvent.click(rowOf('x').getByRole('button', { name: 'set up social app' }));
    await userEvent.click(screen.getByRole('button', { name: 'stub done' }));
    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('Could not reload social apps', failure),
    );
  });
});
