import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen } from '@testing-library/react';
import { useOnline } from '@/pwa/useOnline';
import { OfflineBanner } from '@/pwa/OfflineBanner';
import { renderWithProviders } from '../test-utils';

function setOnLine(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);
}

describe('useOnline', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts from the browser's own reading", () => {
    setOnLine(false);
    expect(renderHook(() => useOnline()).result.current).toBe(false);
  });

  it('assumes online where there is no navigator to ask', () => {
    vi.stubGlobal('navigator', undefined);
    expect(renderHook(() => useOnline()).result.current).toBe(true);
  });

  it('follows the offline and online events, and stops listening on unmount', () => {
    setOnLine(true);
    const { result, unmount } = renderHook(() => useOnline());

    act(() => {
      globalThis.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
    act(() => {
      globalThis.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);

    const remove = vi.spyOn(globalThis, 'removeEventListener');
    unmount();
    expect(remove.mock.calls.map(([type]) => type)).toEqual(['online', 'offline']);
  });
});

describe('OfflineBanner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stays hidden while online', () => {
    setOnLine(true);
    renderWithProviders(<OfflineBanner />);

    expect(screen.queryByText(/You are offline/)).not.toBeInTheDocument();
  });

  it('warns when the connection drops', () => {
    setOnLine(true);
    renderWithProviders(<OfflineBanner />);

    act(() => {
      globalThis.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You are offline. Anything you save will not reach the server until the connection is back.',
    );
  });
});
