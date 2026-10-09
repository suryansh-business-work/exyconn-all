import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import {
  CreateApiKeyDocument,
  ListApiKeysDocument,
  RevokeApiKeyDocument,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ApiKeysPanel } from '../../../../src/pages/integrations/ApiKeysPanel';
import { apiKey, oneTimeValue } from './integrations.fixtures';

const list = (rows = [apiKey()], delay = 0): MockLink.MockedResponse => ({
  request: { query: ListApiKeysDocument },
  result: { data: { listApiKeys: rows } },
  delay,
});

const created = (plaintext: string): MockLink.MockedResponse => ({
  request: { query: CreateApiKeyDocument, variables: { name: 'CI bot', roles: ['HR'] } },
  result: {
    data: {
      createApiKey: {
        __typename: 'IssuedApiKey',
        key: plaintext,
        apiKey: apiKey({ id: 'key-2', name: 'CI bot', roles: ['HR'] }),
      },
    },
  },
});

const revoked = (error?: Error): MockLink.MockedResponse => ({
  request: { query: RevokeApiKeyDocument, variables: { id: 'key-1' } },
  ...(error ? { error } : { result: { data: { revokeApiKey: apiKey({ revokedAt: 'x' }) } } }),
});

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

describe('ApiKeysPanel', () => {
  it('shows a loader, then each key with its roles, last use and state', async () => {
    const { container } = renderWithProviders(<ApiKeysPanel />, {
      mocks: [
        list(
          [apiKey(), apiKey({ id: 'key-9', name: 'Old', lastUsedAt: null, revokedAt: 'r' })],
          20,
        ),
      ],
    });
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    const active = await screen.findByText('Payroll sync');
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    const row = active.closest('tr') as HTMLElement;
    expect(within(row).getByText('exy_ab12')).toBeInTheDocument();
    expect(within(row).getByText('HR, Finance')).toBeInTheDocument();
    expect(within(row).getByText(/Sep 2026/)).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Revoke key' })).toBeInTheDocument();
    expect(within(rowOf('Old')).getByText('Never')).toBeInTheDocument();
    expect(within(rowOf('Old')).getByText('Revoked')).toBeInTheDocument();
    expect(within(rowOf('Old')).queryByRole('button', { name: 'Revoke key' })).toBeNull();
  });

  it('refuses a key without a name or without a role', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPanel />, { mocks: [list()] });
    await screen.findByText('Payroll sync');
    await user.click(screen.getByRole('button', { name: 'Create key' }));
    expect(await screen.findByText('Name the key and give it at least one role.')).toBeVisible();

    await user.type(screen.getByLabelText('Name'), '   ');
    await user.click(screen.getByRole('button', { name: 'HR' }));
    await user.click(screen.getByRole('button', { name: 'Create key' }));
    expect(screen.getAllByText('Name the key and give it at least one role.')).not.toHaveLength(0);
  });

  it('issues a key once, with the trimmed name and only the roles left ticked', async () => {
    const user = userEvent.setup();
    const plaintext = oneTimeValue('key');
    renderWithProviders(<ApiKeysPanel />, {
      mocks: [
        list(),
        created(plaintext),
        list([apiKey(), apiKey({ id: 'key-2', name: 'CI bot' })]),
      ],
    });
    await screen.findByText('Payroll sync');
    await user.type(screen.getByLabelText('Name'), '  CI bot  ');
    await user.click(screen.getByRole('button', { name: 'HR' }));
    await user.click(screen.getByRole('button', { name: 'Finance' }));
    await user.click(screen.getByRole('button', { name: 'Finance' }));
    await user.click(screen.getByRole('button', { name: 'Create key' }));

    expect(await screen.findByText(plaintext)).toBeInTheDocument();
    expect(screen.getByText('Copy this key now — it is never shown again.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(await screen.findByText('CI bot')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText(plaintext)).toBeNull());
  });

  it('says why a key could not be created and keeps what was typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPanel />, {
      mocks: [
        list(),
        {
          request: { query: CreateApiKeyDocument, variables: { name: 'CI bot', roles: ['HR'] } },
          error: new Error('Role not grantable'),
        },
      ],
    });
    await screen.findByText('Payroll sync');
    await user.type(screen.getByLabelText('Name'), 'CI bot');
    await user.click(screen.getByRole('button', { name: 'HR' }));
    await user.click(screen.getByRole('button', { name: 'Create key' }));
    expect(await screen.findByText('Role not grantable')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('CI bot');
  });

  it('revokes a key only once the administrator confirms', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPanel />, {
      mocks: [list(), revoked(), list([apiKey({ revokedAt: '2026-09-20T00:00:00.000Z' })])],
    });
    await user.click(await screen.findByRole('button', { name: 'Revoke key' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Revoke this key? Anything using it stops working immediately.'),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: 'Revoke key' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Revoke key' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Revoke' }),
    );
    expect(
      await screen.findByText('Key revoked. Anything using it stops working immediately.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Revoked')).toBeInTheDocument();
  });

  it('says why a key could not be revoked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPanel />, {
      mocks: [list(), revoked(new Error('Already revoked'))],
    });
    await user.click(await screen.findByRole('button', { name: 'Revoke key' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Revoke' }),
    );
    expect(await screen.findByText('Already revoked')).toBeInTheDocument();
  });
});
