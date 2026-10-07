import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { useConnectOutcome } from '../../../../src/pages/social/useConnectOutcome';
import { renderHookWithProviders, useCurrentUrl } from '../../test-utils';

const feedback = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => feedback.notify,
}));

/** Runs the hook at `route` and reports the address it leaves behind. */
function renderAt(route: string) {
  const onConnected = vi.fn();
  const { result } = renderHookWithProviders(
    () => {
      useConnectOutcome(onConnected);
      return useCurrentUrl();
    },
    { route },
  );
  return { result, onConnected };
}

describe('useConnectOutcome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('announces the accounts a provider connected once, reloads, and clears the address', async () => {
    const { result, onConnected } = renderAt('/marketing/social/accounts?connected=META&count=2');

    await waitFor(() => expect(result.current).toBe('/marketing/social/accounts'));
    expect(feedback.notify).toHaveBeenCalledTimes(1);
    expect(feedback.notify).toHaveBeenCalledWith('Connected {count} account(s)', 'success', {
      count: '2',
    });
    expect(onConnected).toHaveBeenCalledTimes(1);
  });

  it('counts one account when the provider does not say how many', async () => {
    const { result } = renderAt('/marketing/social/accounts?connected=X');

    await waitFor(() => expect(result.current).toBe('/marketing/social/accounts'));
    expect(feedback.notify).toHaveBeenCalledWith('Connected {count} account(s)', 'success', {
      count: '1',
    });
  });

  it("reports the provider's error without reloading", async () => {
    const { result, onConnected } = renderAt(
      '/marketing/social/accounts?error=The%20consent%20was%20declined',
    );

    await waitFor(() => expect(result.current).toBe('/marketing/social/accounts'));
    expect(feedback.notify).toHaveBeenCalledWith('The consent was declined', 'error');
    expect(onConnected).not.toHaveBeenCalled();
  });

  it('stays quiet and leaves the address alone with no outcome in it', () => {
    const { result, onConnected } = renderAt('/marketing/social/accounts?tab=x');

    expect(result.current).toBe('/marketing/social/accounts?tab=x');
    expect(feedback.notify).not.toHaveBeenCalled();
    expect(onConnected).not.toHaveBeenCalled();
  });
});
