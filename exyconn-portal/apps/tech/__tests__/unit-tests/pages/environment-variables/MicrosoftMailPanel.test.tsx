import { describe, expect, it, vi } from 'vitest';
import { MicrosoftMailPanel } from '../../../../src/pages/environment-variables/MicrosoftMailPanel';
import { renderWithProviders } from '../../test-utils';
import { propsOf, resetHarness } from './panel.harness';
import { describeSingletonPanel } from './singleton-panel.suite';

const gql = vi.hoisted(() => ({ query: vi.fn() }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMicrosoftMailConfigQuery: gql.query,
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: logger,
}));
vi.mock('../../../../src/pages/environment-variables/forms/microsoft-mail-config', async () =>
  (await import('./panel.harness')).propsModule('MicrosoftMailConfigForm'),
);
vi.mock('../../../../src/pages/environment-variables/MicrosoftMailConnection', async () =>
  (await import('./panel.harness')).propsModule('MicrosoftMailConnection'),
);

const config = {
  id: 'ms-1',
  clientId: '11111111-2222-3333-4444-555555555555',
  tenant: 'common',
  hasClientSecret: true,
  clientSecretHint: null,
  enabled: true,
  accountCount: 4,
  redirectUri: 'https://api.example.test/oauth/microsoft/callback',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

describeSingletonPanel({
  name: 'MicrosoftMailPanel',
  Panel: MicrosoftMailPanel,
  query: gql.query,
  dataKey: 'microsoftMailConfig',
  config,
  logger,
  title: 'Microsoft Mail',
  loadError: 'Could not load Microsoft Mail.',
  retryLog: 'tech: reloading Microsoft Mail failed',
  form: 'MicrosoftMailConfigForm',
  redirectUri: config.redirectUri,
  keepsLoadedConfigOnError: true,
});

describe('MicrosoftMailPanel connection', () => {
  it('hands the mailbox count to the CRM connection box', () => {
    resetHarness();
    gql.query.mockReturnValue({ data: { microsoftMailConfig: config }, refetch: vi.fn() });
    renderWithProviders(<MicrosoftMailPanel />);
    expect(propsOf('MicrosoftMailConnection').accountCount).toBe(4);
  });
});
