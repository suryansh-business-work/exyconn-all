import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  MicrosoftMailConfigForm,
  type MicrosoftMailConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/microsoft-mail-config';
import { renderWithProviders } from '../../../../test-utils';
import { notify } from '../../panel.harness';
import { expectMessages, fill, press } from '../form.helpers';
import { describeOAuthClientForm } from '../oauth-client-form.suite';

const gql = vi.hoisted(() => ({ save: vi.fn() }));
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveMicrosoftMailConfigMutation: () => [gql.save],
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: logger,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('../../panel.harness')).notifyModule(importOriginal),
);

const stored = (overrides: Partial<MicrosoftMailConfigRow> = {}): MicrosoftMailConfigRow => ({
  id: 'ms-1',
  clientId: '11111111-2222-3333-4444-555555555555',
  tenant: 'organizations',
  hasClientSecret: true,
  clientSecretHint: null,
  enabled: true,
  accountCount: 1,
  redirectUri: 'https://api.example.test/oauth/microsoft/callback',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

describeOAuthClientForm({
  name: 'MicrosoftMailConfigForm',
  render: (overrides) => <MicrosoftMailConfigForm initial={stored(overrides)} />,
  save: gql.save,
  logger,
  clientIdLabel: 'Application (client) ID',
  validClientId: '99999999-8888-7777-6666-555555555555',
  storedClientId: '11111111-2222-3333-4444-555555555555',
  switchLabel: 'Let the CRM send email through Microsoft mailboxes',
  extraInput: { tenant: 'organizations' },
  missingClientId: 'Add the client ID before turning Microsoft Mail on',
  missingSecret: 'Add the client secret before turning Microsoft Mail on',
  newSecretHint: 'Certificates & secrets > New client secret: copy its Value, not its ID',
  saved: 'Microsoft Mail settings saved',
  saveFailedLog: 'tech: saving Microsoft Mail failed',
  saveFailedFallback: 'Could not save Microsoft Mail',
});

describe('MicrosoftMailConfigForm tenant', () => {
  it('starts a blank tenant on "common" and sends it', async () => {
    gql.save.mockReset().mockResolvedValue({ data: {} });
    renderWithProviders(<MicrosoftMailConfigForm initial={stored({ tenant: '' })} />);
    expect(screen.getByLabelText('Tenant')).toHaveValue('common');
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    await press('Save changes');
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Microsoft Mail settings saved', 'success'));
    expect(gql.save.mock.calls[0][0].variables.input.tenant).toBe('common');
  });

  it('rejects a tenant that is too long', async () => {
    gql.save.mockReset();
    renderWithProviders(<MicrosoftMailConfigForm initial={stored()} />);
    fill('Tenant', 't'.repeat(201));
    await press('Save changes');
    await expectMessages('That is too long for a tenant');
    expect(gql.save).not.toHaveBeenCalled();
  });
});
