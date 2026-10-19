import { vi } from 'vitest';
import { MicrosoftMailConnection } from '../../../../src/pages/environment-variables/MicrosoftMailConnection';
import { describeMailConnection } from './mail-connection.suite';

const gql = vi.hoisted(() => ({ test: vi.fn() }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTestMicrosoftMailConfigMutation: () => [gql.test, { loading: false }],
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: logger,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);

describeMailConnection({
  name: 'MicrosoftMailConnection',
  render: (accountCount) => <MicrosoftMailConnection accountCount={accountCount} />,
  mutation: gql.test,
  resultKey: 'testMicrosoftMailConfig',
  logger,
  connected: '3 Microsoft mailboxes connected in the CRM.',
  none: 'No Microsoft mailbox connected yet. Save the app, then connect mailboxes in the CRM.',
  manageLabel: 'Manage mailboxes in the CRM',
  crmPath: '/integrations/email',
  fallbackSuccess: 'Microsoft answered',
  fallbackFailure: 'The Microsoft Mail test failed',
  failureLog: 'tech: the Microsoft Mail test failed',
  crashLog: 'tech: Microsoft Mail test failed',
});
