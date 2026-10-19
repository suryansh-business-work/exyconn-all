import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useMapsScript } from '../../../src/maps/mapsScript';

const loader = vi.hoisted(() => ({ options: vi.fn() }));

vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: (options: unknown) => {
    loader.options(options);
    return { isLoaded: true, loadError: undefined };
  },
}));

type MapsGlobal = typeof globalThis & { gm_authFailure?: () => void };

describe('useMapsScript', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the one shared Maps script with the key and the core library only', () => {
    const { result } = renderHook(() => useMapsScript('maps-key'));

    expect(loader.options).toHaveBeenCalledWith({
      id: 'exyconn-google-maps',
      googleMapsApiKey: 'maps-key',
      libraries: [],
    });
    expect(result.current).toEqual({ isLoaded: true, loadError: undefined, authFailed: false });
  });

  // Runs last: once Google rejects the key the module remembers it for the page's lifetime.
  it('tells every mounted map, and logs, when Google rejects the key', () => {
    const error = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    const first = renderHook(() => useMapsScript('maps-key'));
    const gone = renderHook(() => useMapsScript('maps-key'));
    gone.unmount();

    act(() => (globalThis as MapsGlobal).gm_authFailure?.());

    expect(first.result.current.authFailed).toBe(true);
    expect(error).toHaveBeenCalledWith('crm: Google rejected the Maps JavaScript key');
    expect(renderHook(() => useMapsScript('maps-key')).result.current.authFailed).toBe(true);
  });
});
