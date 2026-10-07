import { renderHook } from '@testing-library/react';
import * as Notifications from 'expo-notifications';
import type { NotificationResponse } from 'expo-notifications';
import { router } from 'expo-router';
import { describe, expect, it, vi } from 'vitest';
import { useNotificationRouting } from '../../../src/hooks/useNotificationRouting';

/** The tapped alert, carrying only the payload the hook reads. */
function tapped(data: Record<string, unknown> | undefined): NotificationResponse {
  return {
    notification: { request: { content: { data } } },
  } as unknown as NotificationResponse;
}

describe('useNotificationRouting', () => {
  it('does nothing until an alert has been tapped', () => {
    vi.mocked(Notifications.useLastNotificationResponse).mockReturnValue(null);
    renderHook(() => useNotificationRouting());
    expect(Notifications.clearLastNotificationResponse).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('opens what the alert points at, then forgets it so a remount does not replay it', () => {
    vi.mocked(Notifications.useLastNotificationResponse).mockReturnValue(
      tapped({ url: '/messages' }),
    );
    renderHook(() => useNotificationRouting());
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/messages');
  });

  it('clears an alert that points nowhere without navigating', () => {
    vi.mocked(Notifications.useLastNotificationResponse).mockReturnValue(tapped({ url: 42 }));
    const { rerender } = renderHook(() => useNotificationRouting());
    vi.mocked(Notifications.useLastNotificationResponse).mockReturnValue(tapped(undefined));
    rerender();
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalledTimes(2);
    expect(router.push).not.toHaveBeenCalled();
  });
});
