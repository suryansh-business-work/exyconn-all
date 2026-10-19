import { vi } from 'vitest';
import { GmailConnection } from '../../../../src/pages/environment-variables/GmailConnection';
import { describeMailConnection } from './mail-connection.suite';

const gql = vi.hoisted(() => ({ test: vi.fn() }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTestGmailConfigMutation: () => [gql.test, { loading: false }],
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: logger,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);

const config = (accountCount: number) => ({
  id: 'gmail-1',
  clientId: 'abc.apps.googleusercontent.com',
  hasClientSecret: true,
  clientSecretHint: null,
  enabled: true,
  accountCount,
  redirectUri: 'https://api.example.test/oauth/gmail',
  updatedAt: null,
});

describeMailConnection({
  name: 'GmailConnection',
  render: (accountCount) => <GmailConnection config={config(accountCount)} />,
  mutation: gql.test,
  resultKey: 'testGmailConfig',
  logger,
  connected: '3 Gmail accounts connected in the CRM.',
  none: 'No Gmail account connected yet. Save the client, then connect accounts in the CRM.',
  manageLabel: 'Manage accounts in the CRM',
  crmPath: '/integrations/email',
  fallbackSuccess: 'Gmail answered',
  fallbackFailure: 'The Gmail test failed',
  failureLog: 'tech: the Gmail test failed',
  crashLog: 'tech: Gmail test failed',
});
