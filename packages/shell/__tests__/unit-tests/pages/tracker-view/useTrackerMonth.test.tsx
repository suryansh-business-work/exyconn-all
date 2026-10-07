import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigationType } from 'react-router-dom';
import { useTrackerMonth } from '@/pages/tracker-view/useTrackerMonth';

function renderAt(route: string) {
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  }
  return renderHook(
    () => ({ state: useTrackerMonth(), location: useLocation(), navigation: useNavigationType() }),
    { wrapper: Wrapper },
  );
}

const localMidnight = (date: string) => new Date(`${date}T00:00:00`).toISOString();

describe('useTrackerMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 4, 20, 10));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the current month with no day selected', () => {
    const { result } = renderAt('/tracker');

    expect(result.current.state.monthLabel).toBe('May 2026');
    expect(result.current.state.selectedDate).toBeNull();
    expect(result.current.state.dayRange).toBeNull();
    expect(result.current.state.range).toEqual({
      from: localMidnight('2026-05-01'),
      to: localMidnight('2026-06-01'),
    });
  });

  it('reads the month and day from the URL', () => {
    const { result } = renderAt('/tracker?month=2026-02&date=2026-02-03');

    expect(result.current.state.monthLabel).toBe('February 2026');
    expect(result.current.state.month).toEqual(new Date(2026, 1, 1));
    expect(result.current.state.selectedDate).toBe('2026-02-03');
    expect(result.current.state.dayRange).toEqual({
      start: localMidnight('2026-02-03'),
      end: localMidnight('2026-02-04'),
    });
  });

  it('falls back to the current month, and no day, when the params are not real dates', () => {
    const { result } = renderAt('/tracker?month=2026-13&date=2026-02-30');

    expect(result.current.state.monthLabel).toBe('May 2026');
    expect(result.current.state.selectedDate).toBeNull();
  });

  it('pages months in the URL, keeping other params and replacing the history entry', () => {
    const { result } = renderAt('/tracker?employee=e1&month=2026-01');

    act(() => result.current.state.prev());
    expect(result.current.location.search).toBe('?employee=e1&month=2025-12');
    expect(result.current.navigation).toBe('REPLACE');
    expect(result.current.state.monthLabel).toBe('December 2025');

    act(() => result.current.state.next());
    act(() => result.current.state.next());
    expect(result.current.location.search).toBe('?employee=e1&month=2026-02');
  });

  it('writes the selected day to the URL', () => {
    const { result } = renderAt('/tracker?month=2026-02');

    act(() => result.current.state.setSelectedDate('2026-02-14'));

    expect(result.current.location.search).toBe('?month=2026-02&date=2026-02-14');
    expect(result.current.navigation).toBe('REPLACE');
    expect(result.current.state.selectedDate).toBe('2026-02-14');
  });
});
