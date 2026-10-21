import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  GmailConfigForm,
  type GmailConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/gmail-config';
import { renderWithProviders } from '../../../../test-utils';
import { expectMessages, fill, press } from '../form.helpers';
import { describeOAuthClientForm } from '../oauth-client-form.suite';

const gql = vi.hoisted(() => ({ save: vi.fn() }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveGmailConfigMutation: () => [gql.save],
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: logger,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('../../panel.harness')).notifyModule(importOriginal),
);

const stored = (overrides: Partial<GmailConfigRow> = {}): GmailConfigRow => ({
  id: 'gmail-1',
  clientId: 'stored.apps.googleusercontent.com',
  hasClientSecret: true,
  clientSecretHint: null,
  enabled: true,
  accountCount: 1,
  redirectUri: 'https://api.example.test/oauth/gmail/callback',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

describeOAuthClientForm({
  name: 'GmailConfigForm',
  render: (overrides) => <GmailConfigForm initial={stored(overrides)} />,
  save: gql.save,
  logger,
  clientIdLabel: 'Client ID',
  validClientId: 'new-client.apps.googleusercontent.com',
  storedClientId: 'stored.apps.googleusercontent.com',
  switchLabel:
    "Turn on Gmail connections: every company's CRM can connect, read and send from its Gmail accounts",
  extraInput: {},
  missingClientId: 'Add the client ID before turning Gmail on',
  missingSecret: 'Add the client secret before turning Gmail on',
  newSecretHint: 'Shown next to the client ID',
  saved: 'Gmail settings saved',
  saveFailedLog: 'tech: saving Gmail failed',
  saveFailedFallback: 'Could not save Gmail',
});

describe('GmailConfigForm client ID', () => {
  it('only takes a Google OAuth client ID', async () => {
    gql.save.mockReset();
    renderWithProviders(<GmailConfigForm initial={stored()} />);
    fill('Client ID', 'not-a-google-client');
    await press('Save changes');
    await expectMessages('A Google client ID ends with .apps.googleusercontent.com');
    expect(gql.save).not.toHaveBeenCalled();
    expect(
      screen.getByText('Saved. Use the eye to see it, or type a new one to replace it.'),
    ).toBeInTheDocument();
  });
});
