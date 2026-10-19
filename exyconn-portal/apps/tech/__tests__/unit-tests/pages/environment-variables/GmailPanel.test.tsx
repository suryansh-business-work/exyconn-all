import { describe, expect, it, vi } from 'vitest';
import { GmailPanel } from '../../../../src/pages/environment-variables/GmailPanel';
import { renderWithProviders } from '../../test-utils';
import { propsOf, resetHarness } from './panel.harness';
import { describeSingletonPanel } from './singleton-panel.suite';

const gql = vi.hoisted(() => ({ query: vi.fn() }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGmailConfigQuery: gql.query,
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: logger,
}));
vi.mock('../../../../src/pages/environment-variables/forms/gmail-config', async () =>
  (await import('./panel.harness')).propsModule('GmailConfigForm'),
);
vi.mock('../../../../src/pages/environment-variables/GmailConnection', async () =>
  (await import('./panel.harness')).propsModule('GmailConnection'),
);

const config = {
  id: 'gmail-1',
  clientId: 'abc.apps.googleusercontent.com',
  hasClientSecret: true,
  clientSecretHint: null,
  enabled: true,
  accountCount: 2,
  redirectUri: 'https://api.example.test/oauth/gmail/callback',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

describeSingletonPanel({
  name: 'GmailPanel',
  Panel: GmailPanel,
  query: gql.query,
  dataKey: 'gmailConfig',
  config,
  logger,
  title: 'Gmail',
  loadError: 'Could not load Gmail.',
  retryLog: 'tech: reloading Gmail failed',
  form: 'GmailConfigForm',
  redirectUri: config.redirectUri,
  keepsLoadedConfigOnError: true,
});

describe('GmailPanel connection', () => {
  it('hands the loaded config to the CRM connection box', () => {
    resetHarness();
    gql.query.mockReturnValue({ data: { gmailConfig: config }, refetch: vi.fn() });
    renderWithProviders(<GmailPanel />);
    expect(propsOf('GmailConnection').config).toBe(config);
  });
});
