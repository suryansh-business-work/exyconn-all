import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowsTable } from '../../../../../src/admin/workflows/list/WorkflowsTable';
import { workflowRow } from '../../admin.fixtures';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';

interface FakeCache {
  identify: (ref: object) => string;
  evict: (options: object) => boolean;
  gc: () => string[];
}
type DeleteOptions = {
  update: (cache: FakeCache, result: unknown, options: { variables?: { id: string } }) => void;
};

const hooks = vi.hoisted(() => ({
  duplicate: vi.fn(),
  remove: vi.fn(),
  notify: vi.fn(),
  confirm: vi.fn(),
  deleteOptions: undefined as unknown,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useDuplicateWhatsappWorkflowMutation: () => [hooks.duplicate],
  useDeleteWhatsappWorkflowMutation: (options: unknown) => {
    hooks.deleteOptions = options;
    return [hooks.remove];
  },
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => hooks.notify,
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => hooks.confirm,
}));

function UrlProbe() {
  return <p data-testid="url">{useCurrentUrl()}</p>;
}

function renderTable(rows = [workflowRow()]) {
  const onRefresh = vi.fn().mockResolvedValue({});
  renderWithProviders(
    <>
      <WorkflowsTable rows={rows} loading={false} onRefresh={onRefresh} />
      <UrlProbe />
    </>,
    { route: '/admin/bot-workflows' },
  );
  return { onRefresh, user: userEvent.setup() };
}

let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  consoleError.mockRestore();
  vi.resetAllMocks();
});

describe('WorkflowsTable', () => {
  it('opens a workflow in the editor from its row', async () => {
    const { user } = renderTable();
    await user.click(screen.getByText('Book a visit'));
    expect(screen.getByTestId('url')).toHaveTextContent('/admin/bot-workflows/wf-1');
  });

  it('opens a workflow in the editor from its action', async () => {
    const { user } = renderTable([workflowRow({ id: 'wf-2' })]);
    await user.click(screen.getByRole('button', { name: 'open workflow' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/admin/bot-workflows/wf-2');
  });

  it('says so when the demo has no workflows, and still refreshes', async () => {
    const { user, onRefresh } = renderTable([]);
    expect(screen.getByText('No workflows in this demo yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('duplicates a workflow as a draft and names the copy', async () => {
    hooks.duplicate.mockResolvedValue({
      data: { duplicateWhatsappWorkflow: { key: 'book-visit-copy' } },
    });
    const { user } = renderTable();
    await user.click(screen.getByRole('button', { name: 'duplicate workflow' }));
    await waitFor(() =>
      expect(hooks.notify).toHaveBeenCalledWith('Copied as "{key}"', 'success', {
        key: 'book-visit-copy',
      }),
    );
    expect(hooks.duplicate).toHaveBeenCalledWith({ variables: { id: 'wf-1' } });
  });

  it('says nothing when a duplicate returns no copy', async () => {
    hooks.duplicate.mockResolvedValue({ data: null });
    const { user } = renderTable();
    await user.click(screen.getByRole('button', { name: 'duplicate workflow' }));
    await waitFor(() => expect(hooks.duplicate).toHaveBeenCalledTimes(1));
    expect(hooks.notify).not.toHaveBeenCalled();
  });

  it('reports a failed duplicate, and logs a notifier that fails too', async () => {
    hooks.duplicate.mockRejectedValue(new Error('Copy refused'));
    const broken = new Error('notify broke');
    hooks.notify.mockImplementation(() => {
      throw broken;
    });
    const { user } = renderTable();
    await user.click(screen.getByRole('button', { name: 'duplicate workflow' }));
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(broken));
    expect(hooks.notify).toHaveBeenCalledWith('Copy refused', 'error');
  });

  it('deletes a workflow only after the destructive confirm', async () => {
    hooks.confirm.mockResolvedValue(true);
    hooks.remove.mockResolvedValue({});
    const { user } = renderTable();
    await user.click(screen.getByRole('button', { name: 'delete' }));
    await waitFor(() => expect(hooks.notify).toHaveBeenCalledWith('Workflow deleted', 'success'));
    expect(hooks.confirm).toHaveBeenCalledWith({
      title: 'Delete workflow',
      message: 'Delete "{name}"? Jump nodes that start it will stop working.',
      messageValues: { name: 'Book a visit' },
      confirmText: 'Delete',
      destructive: true,
    });
    expect(hooks.remove).toHaveBeenCalledWith({ variables: { id: 'wf-1' } });
  });

  it('keeps the workflow when the confirm is declined', async () => {
    hooks.confirm.mockResolvedValue(false);
    const { user } = renderTable();
    await user.click(screen.getByRole('button', { name: 'delete' }));
    await waitFor(() => expect(hooks.confirm).toHaveBeenCalledTimes(1));
    expect(hooks.remove).not.toHaveBeenCalled();
  });

  it('says why a delete failed, with a fallback for a non-Error', async () => {
    hooks.confirm.mockResolvedValue(true);
    hooks.remove.mockRejectedValue('offline');
    const { user } = renderTable();
    await user.click(screen.getByRole('button', { name: 'delete' }));
    await waitFor(() =>
      expect(hooks.notify).toHaveBeenCalledWith('Could not delete the workflow', 'error'),
    );
  });

  it('logs a confirm that itself fails', async () => {
    const failure = new Error('confirm broke');
    hooks.confirm.mockRejectedValue(failure);
    const { user } = renderTable();
    await user.click(screen.getByRole('button', { name: 'delete' }));
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(failure));
  });

  it('evicts a deleted workflow from the cache', () => {
    renderTable();
    const { update } = hooks.deleteOptions as DeleteOptions;
    const cache: FakeCache = {
      identify: vi.fn(() => 'WhatsappWorkflow:wf-1'),
      evict: vi.fn(() => true),
      gc: vi.fn(() => []),
    };
    update(cache, {}, { variables: { id: 'wf-1' } });
    expect(cache.identify).toHaveBeenCalledWith({ __typename: 'WhatsappWorkflow', id: 'wf-1' });
    expect(cache.evict).toHaveBeenCalledWith({ id: 'WhatsappWorkflow:wf-1' });
    expect(cache.gc).toHaveBeenCalledTimes(1);
    update(cache, {}, {});
    expect(cache.evict).toHaveBeenCalledTimes(1);
  });
});
