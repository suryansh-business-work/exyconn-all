import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useLocationSuggestions } from '../../../../../../src/pages/lead-generator/forms/lead-search/useLocationSuggestions';

interface QueryOptions {
  variables: { input: string };
  skip: boolean;
}

const query = vi.hoisted(() => ({
  calls: [] as QueryOptions[],
  result: {} as Record<string, unknown>,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useLeadLocationSuggestionsQuery: (options: QueryOptions) => {
    query.calls.push(options);
    return query.result;
  },
}));

const PUNE = { placeId: 'pune', text: 'Pune, India', mainText: 'Pune', secondaryText: 'India' };
const PATNA = { placeId: 'patna', text: 'Patna, India', mainText: 'Patna', secondaryText: 'India' };

const lastCall = () => query.calls.at(-1);

function typed(initial: string) {
  return renderHook(({ input }) => useLocationSuggestions(input), {
    initialProps: { input: initial },
  });
}

describe('useLocationSuggestions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    query.calls = [];
    query.result = { loading: false };
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('asks for nothing under two characters', () => {
    query.result = { loading: true, data: { leadLocationSuggestions: [PUNE] } };
    const { result } = typed('P');

    expect(lastCall()).toEqual({ variables: { input: 'P' }, skip: true });
    expect(result.current).toEqual({ suggestions: [], loading: false });
  });

  it('waits for typing to pause, then asks for the trimmed text', () => {
    const { rerender } = typed('');
    rerender({ input: 'Pu' });
    rerender({ input: ' Pune ' });
    expect(lastCall()?.skip).toBe(true);

    act(() => vi.advanceTimersByTime(299));
    expect(lastCall()?.skip).toBe(true);
    act(() => vi.advanceTimersByTime(1));

    expect(lastCall()).toEqual({ variables: { input: 'Pune' }, skip: false });
    expect(query.calls.some((call) => call.variables.input === 'Pu' && !call.skip)).toBe(false);
  });

  it('returns the suggestions and the loading state', () => {
    query.result = { loading: true, data: { leadLocationSuggestions: [PUNE] } };
    const { result } = typed('Pune');

    expect(result.current).toEqual({ suggestions: [PUNE], loading: true });
  });

  it('keeps the previous suggestions while the next ones load', () => {
    query.result = {
      loading: true,
      data: undefined,
      previousData: { leadLocationSuggestions: [PATNA] },
    };
    const { result } = typed('Pat');

    expect(result.current.suggestions).toEqual([PATNA]);
  });

  it('logs a failure and leaves the list empty', () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('quota');
    query.result = { loading: false, error: failure };
    const { result } = typed('Pune');

    expect(result.current).toEqual({ suggestions: [], loading: false });
    expect(warn).toHaveBeenCalledWith('crm: lead location suggestions failed', failure);
  });
});
