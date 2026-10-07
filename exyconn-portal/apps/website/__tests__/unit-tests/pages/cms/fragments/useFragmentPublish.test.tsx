import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFragmentPublish } from '../../../../../src/pages/cms/fragments/useFragmentPublish';

const spies = vi.hoisted(() => ({ publish: vi.fn(), notify: vi.fn(), reload: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublishCmsFragmentMutation: () => [spies.publish],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => spies.notify,
}));

const header = { id: 'fragment-1', name: 'Header' };

function publishHeader() {
  const { result } = renderHook(() => useFragmentPublish(spies.reload));
  result.current(header);
}

describe('useFragmentPublish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.publish.mockResolvedValue({ data: {} });
    spies.reload.mockResolvedValue(undefined);
  });

  it('publishes the fragment, says where it is live and reloads', async () => {
    publishHeader();

    await waitFor(() => expect(spies.reload).toHaveBeenCalledTimes(1));
    expect(spies.publish).toHaveBeenCalledWith({ variables: { id: 'fragment-1' } });
    expect(spies.notify).toHaveBeenCalledWith(
      '{name} is live on every page that uses it',
      'success',
      { name: 'Header' },
    );
  });

  it("shows the server's refusal and does not reload", async () => {
    spies.publish.mockRejectedValueOnce(new Error('The header has a broken placeholder'));
    publishHeader();

    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('The header has a broken placeholder', 'error'),
    );
    expect(spies.reload).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure without a reason', async () => {
    spies.publish.mockRejectedValueOnce('offline');
    publishHeader();

    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Could not publish the fragment', 'error'),
    );
  });

  it('reports a reload that failed after publishing', async () => {
    spies.reload.mockRejectedValueOnce(new Error('Reload broke'));
    publishHeader();

    await waitFor(() => expect(spies.notify).toHaveBeenCalledWith('Reload broke', 'error'));
    expect(spies.notify).toHaveBeenCalledTimes(2);
  });
});
