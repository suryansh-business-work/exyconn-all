import { describe, expect, it, vi } from 'vitest';
import {
  GoogleSignInConfigForm,
  type GoogleSignInConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/google-sign-in-config';
import { renderWithProviders } from '../../../../test-utils';
import { expectMessages, fill, press } from '../form.helpers';
import { describeOAuthClientForm } from '../oauth-client-form.suite';

const gql = vi.hoisted(() => ({ save: vi.fn() }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveGoogleSignInConfigMutation: () => [gql.save],
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: logger,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('../../panel.harness')).notifyModule(importOriginal),
);

const stored = (overrides: Partial<GoogleSignInConfigRow> = {}): GoogleSignInConfigRow => ({
  id: 'gsi-1',
  clientId: 'stored.apps.googleusercontent.com',
  hasClientSecret: true,
  clientSecretHint: null,
  enabled: true,
  redirectUri: 'https://api.example.test/oauth/google/callback',
  updatedAt: '2026-10-01T10:00:00.000Z',
  updatedByName: 'Asha',
  ...overrides,
});

describeOAuthClientForm({
  name: 'GoogleSignInConfigForm',
  render: (overrides) => <GoogleSignInConfigForm initial={stored(overrides)} />,
  save: gql.save,
  logger,
  clientIdLabel: 'Client ID',
  validClientId: 'new-client.apps.googleusercontent.com',
  storedClientId: 'stored.apps.googleusercontent.com',
  switchLabel: 'Show Continue with Google on the portal sign-in',
  extraInput: {},
  missingClientId: 'Add the client ID before turning Google sign-in on',
  missingSecret: 'Add the client secret before turning Google sign-in on',
  newSecretHint: 'Shown next to the client ID',
  saved: 'Google sign-in saved',
  saveFailedLog: 'tech: saving Google sign-in failed',
  saveFailedFallback: 'Could not save Google sign-in',
});

describe('GoogleSignInConfigForm client ID', () => {
  it('only takes a Google OAuth client ID', async () => {
    gql.save.mockReset();
    renderWithProviders(<GoogleSignInConfigForm initial={stored()} />);
    fill('Client ID', 'not-a-google-client');
    await press('Save changes');
    await expectMessages('A Google client ID ends with .apps.googleusercontent.com');
    expect(gql.save).not.toHaveBeenCalled();
  });
});
