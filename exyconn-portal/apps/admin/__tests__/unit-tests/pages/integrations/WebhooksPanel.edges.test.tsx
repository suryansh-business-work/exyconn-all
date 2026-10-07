import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { WebhooksPanel } from '../../../../src/pages/integrations/WebhooksPanel';
import { webhook } from './integrations.fixtures';

/**
 * What the panel does when the layers under it misbehave in ways Apollo and the real
 * providers never do: no list yet, a rejection that is not an Error, an answer with no data,
 * and a notifier or confirm that itself throws.
 */
const hooks = vi.hoisted(() => ({
  notify: vi.fn(),
  confirm: vi.fn(),
  createWebhook: vi.fn(),
  setActive: vi.fn(),
  deleteWebhook: vi.fn(),
  refetch: vi.fn(),
  list: { data: undefined as unknown, loading: false },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useListWebhooksQuery: () => ({ ...hooks.list, refetch: hooks.refetch }),
  useCreateWebhookMutation: () => [hooks.createWebhook],
  useSetWebhookActiveMutation: () => [hooks.setActive],
  useDeleteWebhookMutation: () => [hooks.deleteWebhook],
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
  hooks.list = { data: { listWebhooks: [webhook()], webhookEvents: [] }, loading: false };
  hooks.refetch.mockResolvedValue({});
  hooks.confirm.mockResolvedValue(true);
});
afterEach(() => vi.resetAllMocks());

const mount = () => {
  const user = userEvent.setup();
  renderWithProviders(<WebhooksPanel />);
  return user;
};

describe('WebhooksPanel when the layers below misbehave', () => {
  it('renders an empty table and no event chips when the list failed to load', () => {
    hooks.list = { data: undefined, loading: false };
    mount();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('falls back to its own words for a create that rejects with a non-Error', async () => {
    hooks.createWebhook.mockRejectedValue('nope');
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Add endpoint' }));
    await waitFor(() =>
      expect(hooks.notify).toHaveBeenCalledWith('Could not create the endpoint', 'error'),
    );
  });

  it('shows no secret when the server answers without one', async () => {
    hooks.createWebhook.mockResolvedValue({ data: undefined });
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Add endpoint' }));
    await waitFor(() => expect(hooks.refetch).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/signing secret/)).toBeNull();
  });

  it('logs, rather than drops, a create that fails even to report itself', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = new Error('notifier gone');
    hooks.createWebhook.mockRejectedValue(new Error('down'));
    hooks.notify.mockImplementation(() => {
      throw broken;
    });
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Add endpoint' }));
    await waitFor(() => expect(logged).toHaveBeenCalledWith('Create webhook failed', broken));
  });

  it('falls back to its own words for a switch or delete that rejects with a non-Error', async () => {
    hooks.setActive.mockRejectedValue(42);
    hooks.deleteWebhook.mockRejectedValue(null);
    const user = mount();
    await user.click(screen.getByRole('switch', { name: 'Enable CRM bridge' }));
    await waitFor(() =>
      expect(hooks.notify).toHaveBeenCalledWith('Could not change the endpoint', 'error'),
    );
    expect(hooks.setActive).toHaveBeenCalledWith({ variables: { id: 'hook-1', active: false } });
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(hooks.notify).toHaveBeenCalledWith('Could not delete the endpoint', 'error'),
    );
    expect(hooks.refetch).not.toHaveBeenCalled();
  });

  it('logs a delete whose confirmation could not even be asked', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = new Error('no dialog');
    hooks.confirm.mockRejectedValue(broken);
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(logged).toHaveBeenCalledWith('Delete', broken));
    expect(hooks.deleteWebhook).not.toHaveBeenCalled();
  });
});
