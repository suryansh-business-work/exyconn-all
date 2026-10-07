import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { NewsletterSubscriberStatus } from '@exyconn/shell/graphql/generated';
import { useSubscriberStatus } from '../../../../../src/pages/cms/newsletter/useSubscriberStatus';

const spies = vi.hoisted(() => ({
  setStatus: vi.fn(),
  confirm: vi.fn(),
  notify: vi.fn(),
  reload: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetNewsletterSubscriberStatusMutation: () => [spies.setStatus],
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => spies.confirm,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => spies.notify,
}));

const row = { id: 'subscriber-1', email: 'asha@example.com' };
const setStatus = () => renderHook(() => useSubscriberStatus(spies.reload)).result.current;

describe('useSubscriberStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.confirm.mockResolvedValue(true);
    spies.setStatus.mockResolvedValue({ data: {} });
  });

  it('unsubscribes once confirmed, then reloads', async () => {
    setStatus()(row, NewsletterSubscriberStatus.Unsubscribed);

    await waitFor(() => expect(spies.reload).toHaveBeenCalledTimes(1));
    expect(spies.confirm).toHaveBeenCalledWith({
      message: 'Unsubscribe {email}? They stop getting the newsletter.',
      messageValues: { email: 'asha@example.com' },
      confirmText: 'Unsubscribe',
    });
    expect(spies.setStatus).toHaveBeenCalledWith({
      variables: { id: 'subscriber-1', status: NewsletterSubscriberStatus.Unsubscribed },
    });
    expect(spies.notify).toHaveBeenCalledWith('Subscription updated', 'success');
  });

  it('keeps the subscription when the question is declined', async () => {
    spies.confirm.mockResolvedValueOnce(false);
    setStatus()(row, NewsletterSubscriberStatus.Unsubscribed);

    await waitFor(() => expect(spies.confirm).toHaveBeenCalled());
    expect(spies.setStatus).not.toHaveBeenCalled();
    expect(spies.reload).not.toHaveBeenCalled();
  });

  it('subscribes again without asking', async () => {
    setStatus()(row, NewsletterSubscriberStatus.Subscribed);

    await waitFor(() => expect(spies.reload).toHaveBeenCalledTimes(1));
    expect(spies.confirm).not.toHaveBeenCalled();
  });

  it('says why the change failed, or that it did', async () => {
    spies.setStatus.mockRejectedValueOnce(new Error('Address bounced'));
    setStatus()(row, NewsletterSubscriberStatus.Subscribed);
    await waitFor(() => expect(spies.notify).toHaveBeenCalledWith('Address bounced', 'error'));

    spies.setStatus.mockRejectedValueOnce('offline');
    setStatus()(row, NewsletterSubscriberStatus.Subscribed);
    await waitFor(() =>
      expect(spies.notify).toHaveBeenCalledWith('Could not update the subscription', 'error'),
    );
    expect(spies.reload).not.toHaveBeenCalled();
  });
});
