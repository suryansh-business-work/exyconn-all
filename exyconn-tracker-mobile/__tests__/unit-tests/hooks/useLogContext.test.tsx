import { renderHook } from '@testing-library/react';
import { usePathname } from 'expo-router';
import type { AuthUser, TrackerStatus } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { useLogContext } from '../../../src/hooks/useLogContext';
import { logger, setLogUser } from '../../../src/tracker/logger';
import { markRoute } from '../../../src/tracker/session-marker';
import type { MobileTrackerState } from '../../../src/tracker/types';

vi.mock('../../../src/tracker/logger', () => ({
  logger: { setRoute: vi.fn(), breadcrumb: vi.fn() },
  setLogUser: vi.fn(),
}));
vi.mock('../../../src/tracker/session-marker', () => ({ markRoute: vi.fn() }));

const ASHA: AuthUser = { id: 'u1', name: 'Asha Rao', email: 'asha@example.test' };

/** Only the two fields the hook reads; the rest of the state does not concern it. */
function stateOf(status: TrackerStatus, user: AuthUser | null): MobileTrackerState {
  return { status, user } as unknown as MobileTrackerState;
}

describe('useLogContext', () => {
  it('names the open screen, the signed-in employee and the status', () => {
    vi.mocked(usePathname).mockReturnValue('/report');
    renderHook(() => useLogContext(stateOf('tracking', ASHA)));
    expect(logger.setRoute).toHaveBeenCalledWith('/report');
    expect(markRoute).toHaveBeenCalledWith('/report');
    expect(setLogUser).toHaveBeenCalledWith(ASHA);
    expect(logger.breadcrumb).toHaveBeenCalledWith('Tracker status tracking');
  });

  it('reports a still-loading app with nobody signed in', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    renderHook(() => useLogContext(null));
    expect(setLogUser).toHaveBeenCalledWith(null);
    expect(logger.breadcrumb).toHaveBeenCalledWith('Tracker status loading');
  });

  it('only reports what changed between renders', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    const { rerender } = renderHook(({ state }) => useLogContext(state), {
      initialProps: { state: stateOf('idle', ASHA) },
    });
    vi.mocked(usePathname).mockReturnValue('/settings');
    rerender({ state: stateOf('paused', ASHA) });
    expect(logger.setRoute).toHaveBeenLastCalledWith('/settings');
    expect(markRoute).toHaveBeenCalledTimes(2);
    expect(logger.breadcrumb).toHaveBeenLastCalledWith('Tracker status paused');
    // Same employee object: nobody new to name.
    expect(setLogUser).toHaveBeenCalledTimes(1);
  });
});
