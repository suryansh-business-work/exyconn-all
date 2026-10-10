import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { ApiKeysPanel } from '../../../../src/pages/integrations/ApiKeysPanel';
import { apiKey } from './integrations.fixtures';

/**
 * What the panel does when the layers under it misbehave in ways Apollo and the real
 * providers never do: a rejection that is not an Error, an answer with no data, and a
 * notifier or confirm that itself throws.
 */
const hooks = vi.hoisted(() => ({
  notify: vi.fn(),
  confirm: vi.fn(),
  createKey: vi.fn(),
  revokeKey: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useListApiKeysQuery: () => ({
    data: { listApiKeys: [apiKey()] },
    loading: false,
    refetch: hooks.refetch,
  }),
  useCreateApiKeyMutation: () => [hooks.createKey],
  useRevokeApiKeyMutation: () => [hooks.revokeKey],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => hooks.notify,
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => hooks.confirm,
}));

beforeEach(() => {
  hooks.refetch.mockResolvedValue({});
  hooks.confirm.mockResolvedValue(true);
});
afterEach(() => vi.resetAllMocks());

async function fillAndCreate() {
  const user = userEvent.setup();
  renderWithProviders(<ApiKeysPanel />);
  await user.type(screen.getByLabelText('Name'), 'CI bot');
  await user.click(screen.getByRole('button', { name: 'Admin' }));
  await user.click(screen.getByRole('button', { name: 'Create key' }));
  return user;
}

describe('ApiKeysPanel when the layers below misbehave', () => {
  it('refuses a named key that has been given no role', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPanel />);
    await user.type(screen.getByLabelText('Name'), 'CI bot');
    await user.click(screen.getByRole('button', { name: 'Create key' }));
    await waitFor(() =>
      expect(hooks.notify).toHaveBeenCalledWith(
        'Name the key and give it at least one role.',
        'error',
      ),
    );
    expect(hooks.createKey).not.toHaveBeenCalled();
  });

  it('falls back to its own words for a rejection that is not an Error', async () => {
    hooks.createKey.mockRejectedValue('nope');
    await fillAndCreate();
    await waitFor(() =>
      expect(hooks.notify).toHaveBeenCalledWith('Could not create the key', 'error'),
    );
    expect(hooks.refetch).not.toHaveBeenCalled();
  });

  it('shows no one-time key when the server answers without one', async () => {
    hooks.createKey.mockResolvedValue({ data: undefined });
    await fillAndCreate();
    await waitFor(() => expect(hooks.refetch).toHaveBeenCalledTimes(1));
    expect(hooks.createKey).toHaveBeenCalledWith({
      variables: { name: 'CI bot', roles: ['ADMIN'] },
    });
    expect(screen.queryByText('Copy this key now — it is never shown again.')).toBeNull();
  });

  it('logs, rather than drops, a create that fails even to report itself', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = new Error('notifier gone');
    hooks.notify.mockImplementation(() => {
      throw broken;
    });
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPanel />);
    await user.click(screen.getByRole('button', { name: 'Create key' }));
    await waitFor(() => expect(logged).toHaveBeenCalledWith('Create key failed', broken));
    expect(hooks.createKey).not.toHaveBeenCalled();
  });

  it('falls back to its own words when a revoke rejects with something odd', async () => {
    hooks.revokeKey.mockRejectedValue({ code: 500 });
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPanel />);
    await user.click(screen.getByRole('button', { name: 'Revoke key' }));
    await waitFor(() =>
      expect(hooks.notify).toHaveBeenCalledWith('Could not revoke the key', 'error'),
    );
    expect(hooks.revokeKey).toHaveBeenCalledWith({ variables: { id: 'key-1' } });
  });

  it('logs a revoke whose confirmation could not even be asked', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = new Error('no dialog');
    hooks.confirm.mockRejectedValue(broken);
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPanel />);
    await user.click(screen.getByRole('button', { name: 'Revoke key' }));
    await waitFor(() => expect(logged).toHaveBeenCalledWith('Revoke', broken));
    expect(hooks.revokeKey).not.toHaveBeenCalled();
  });

  it('reloads the list from the table’s refresh button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApiKeysPanel />);
    await user.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(hooks.refetch).toHaveBeenCalledTimes(1);
  });
});
