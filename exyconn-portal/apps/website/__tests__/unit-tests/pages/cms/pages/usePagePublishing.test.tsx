import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePagePublishing } from '../../../../../src/pages/cms/pages';

const spies = vi.hoisted(() => ({
  publish: vi.fn(),
  unpublish: vi.fn(),
  confirm: vi.fn(),
  notify: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublishCmsPageMutation: () => [spies.publish],
  useUnpublishCmsPageMutation: () => [spies.unpublish],
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => spies.confirm,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => spies.notify,
}));

const page = { id: 'page-1', title: 'About us' };
const publishing = () => renderHook(() => usePagePublishing(spies.reload)).result.current;

describe('usePagePublishing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.publish.mockResolvedValue({ data: {} });
    spies.unpublish.mockResolvedValue({ data: {} });
    spies.confirm.mockResolvedValue(true);
  });

  it('puts the saved draft live and reloads', async () => {
    publishing().publish(page);

    await waitFor(() => expect(spies.reload).toHaveBeenCalledTimes(1));
    expect(spies.publish).toHaveBeenCalledWith({ variables: { id: 'page-1' } });
    expect(spies.notify).toHaveBeenCalledWith('{title} is live', 'success', { title: 'About us' });
  });

  it("shows the server's refusal to publish", async () => {
    spies.publish.mockRejectedValueOnce(new Error('Unknown component "hero"'));
    publishing().publish(page);
    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Unknown component "hero"', 'error'),
    );

    spies.publish.mockRejectedValueOnce('offline');
    publishing().publish(page);
    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Could not publish the page', 'error'),
    );
    expect(spies.reload).not.toHaveBeenCalled();
  });

  it('takes a page off the site after asking, and reloads', async () => {
    publishing().unpublish(page);

    await waitFor(() => expect(spies.reload).toHaveBeenCalledTimes(1));
    expect(spies.confirm).toHaveBeenCalledWith({
      title: 'Unpublish {title}?',
      titleValues: { title: 'About us' },
      message:
        'Visitors will get the not-found page. The draft is kept and can be published again.',
      confirmText: 'Unpublish',
      destructive: true,
    });
    expect(spies.unpublish).toHaveBeenCalledWith({ variables: { id: 'page-1' } });
    expect(spies.notify).toHaveBeenCalledWith('{title} is no longer on the site', 'success', {
      title: 'About us',
    });
  });

  it('keeps the page live when the question is declined', async () => {
    spies.confirm.mockResolvedValueOnce(false);
    publishing().unpublish(page);

    await waitFor(() => expect(spies.confirm).toHaveBeenCalled());
    expect(spies.unpublish).not.toHaveBeenCalled();
  });

  it('says why unpublishing failed, or that it did', async () => {
    spies.unpublish.mockRejectedValueOnce(new Error('It is the not-found page'));
    publishing().unpublish(page);
    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('It is the not-found page', 'error'),
    );

    spies.unpublish.mockRejectedValueOnce('offline');
    publishing().unpublish(page);
    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Could not unpublish the page', 'error'),
    );
  });
});
