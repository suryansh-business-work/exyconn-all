import type { ReactNode } from 'react';
import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';

function setup() {
  return renderHook(() => ({ go: useCrossAppNavigate(), location: useLocation() }), {
    wrapper: ({ children }: Readonly<{ children: ReactNode }>) => (
      <MemoryRouter initialEntries={['/apps']}>{children}</MemoryRouter>
    ),
  }).result;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useCrossAppNavigate', () => {
  // The test bundle is the hub app (VITE_PORTAL_APP unset), served on localhost ports.
  it('changes route client-side when the target lives in this app', () => {
    const result = setup();
    act(() => result.current.go('hub', '/settings?tab=general'));
    expect(result.current.location.pathname).toBe('/settings');
    expect(result.current.location.search).toBe('?tab=general');
  });

  it("loads the other app's page when the target belongs to another app", () => {
    const result = setup();
    const assign = vi.fn();
    // jsdom's location cannot be spied on, so the page-load call meets a stand-in location.
    vi.stubGlobal('location', { assign });
    result.current.go('hr', '/hr/leave');
    vi.unstubAllGlobals();

    expect(assign).toHaveBeenCalledWith('http://localhost:4027/hr/leave');
    expect(result.current.location.pathname).toBe('/apps');
  });
});
