import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useInstallPrompt } from '@/pwa/useInstallPrompt';

/** The `beforeinstallprompt` event Chromium fires, with a prompt the test controls. */
function installEvent(prompt: () => Promise<void>) {
  return Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(prompt),
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  });
}

describe('useInstallPrompt', () => {
  it('offers nothing until the browser says the portal can be installed', () => {
    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.available).toBe(false);
    // Asking anyway is harmless.
    act(() => result.current.install());
    expect(result.current.available).toBe(false);
  });

  it("holds the browser's event, suppressing its own bar, and prompts once on install", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = installEvent(() => Promise.resolve());

    act(() => {
      globalThis.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(result.current.available).toBe(true);

    act(() => result.current.install());
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(result.current.available).toBe(false);
  });

  it('swallows a prompt the browser refuses', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = installEvent(() => Promise.reject(new Error('Already shown')));
    act(() => {
      globalThis.dispatchEvent(event);
    });

    act(() => result.current.install());

    await expect(event.prompt.mock.results[0].value).rejects.toThrow('Already shown');
    expect(result.current.available).toBe(false);
  });

  it('withdraws the offer once the app is installed, and stops listening on unmount', () => {
    const { result, unmount } = renderHook(() => useInstallPrompt());
    act(() => {
      globalThis.dispatchEvent(installEvent(() => Promise.resolve()));
    });

    act(() => {
      globalThis.dispatchEvent(new Event('appinstalled'));
    });
    expect(result.current.available).toBe(false);

    const remove = vi.spyOn(globalThis, 'removeEventListener');
    unmount();
    expect(remove.mock.calls.map(([type]) => type)).toEqual([
      'beforeinstallprompt',
      'appinstalled',
    ]);
    remove.mockRestore();
  });
});
