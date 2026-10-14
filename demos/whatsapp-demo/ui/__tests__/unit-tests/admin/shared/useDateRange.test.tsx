import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  RANGE_PRESETS,
  presetRange,
  useDateRange,
} from '../../../../src/admin/shared/useDateRange';
import { renderHookWithProviders, useCurrentUrl } from '../../test-utils';

/** 7 October 2026, mid-afternoon local time. */
const NOW = new Date(2026, 9, 7, 15, 30);

function mount(route: string) {
  return renderHookWithProviders(() => ({ state: useDateRange(), url: useCurrentUrl() }), {
    route,
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe('presetRange', () => {
  it('ends today and counts both ends', () => {
    expect(RANGE_PRESETS).toEqual([7, 30, 90]);
    expect(presetRange(7)).toEqual({ from: new Date(2026, 9, 1), to: new Date(2026, 9, 7) });
    expect(presetRange(1)).toEqual({ from: new Date(2026, 9, 7), to: new Date(2026, 9, 7) });
  });
});

describe('useDateRange', () => {
  it('defaults to the last 30 days with whole-day server bounds', () => {
    const { result } = mount('/admin/analytics');
    const { state } = result.current;
    expect(state.range).toEqual({ from: new Date(2026, 8, 8), to: new Date(2026, 9, 7) });
    expect(state.preset).toBe(30);
    expect(state.variables).toEqual({
      from: new Date(2026, 8, 8).toISOString(),
      to: new Date(2026, 9, 7, 23, 59, 59, 999).toISOString(),
    });
  });

  it('reads the period from the URL and recognises a preset that ends today', () => {
    const { result } = mount('/admin/analytics?from=2026-10-01&to=2026-10-07');
    expect(result.current.state.range).toEqual({
      from: new Date(2026, 9, 1),
      to: new Date(2026, 9, 7),
    });
    expect(result.current.state.preset).toBe(7);
  });

  it('has no preset for a range that ends before today', () => {
    const { result } = mount('/admin/analytics?from=2026-09-04&to=2026-10-03');
    expect(result.current.state.preset).toBeNull();
  });

  it('has no preset for a hand-picked length that ends today', () => {
    const { result } = mount('/admin/analytics?from=2026-10-03&to=2026-10-07');
    expect(result.current.state.preset).toBeNull();
  });

  it('falls back to the default for an empty or unreadable day', () => {
    const { result } = mount('/admin/analytics?from=&to=not-a-day');
    expect(result.current.state.range).toEqual({
      from: new Date(2026, 8, 8),
      to: new Date(2026, 9, 7),
    });
  });

  it('writes a new period to the URL, keeping the rest of the query', () => {
    const { result } = mount('/admin/sessions?view=grid');
    act(() => {
      result.current.state.setRange({ from: new Date(2026, 6, 1), to: new Date(2026, 6, 31) });
    });
    expect(result.current.url).toBe('/admin/sessions?view=grid&from=2026-07-01&to=2026-07-31');
    expect(result.current.state.range).toEqual({
      from: new Date(2026, 6, 1),
      to: new Date(2026, 6, 31),
    });
    expect(result.current.state.preset).toBeNull();
  });
});
