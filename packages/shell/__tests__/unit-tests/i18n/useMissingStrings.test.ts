import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTranslateMissingMutation } from '@/graphql/generated';
import { useMissingStrings } from '@/i18n/useMissingStrings';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useTranslateMissingMutation: vi.fn(),
}));

const translate = vi.fn();
const translated = (count: number) => ({
  data: {
    translateMissing: Array.from({ length: count }, (_, i) => ({
      key: `k${i}`,
      source: `s${i}`,
      text: `t${i}`,
    })),
  },
});

function setup(locale = 'fr', enabled = true) {
  return renderHook((props) => useMissingStrings(props.locale, props.enabled), {
    initialProps: { locale, enabled },
  });
}

/** Lets the batch timer fire and the mutation's promise settle. */
async function flushBatch() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  translate.mockReset();
  vi.mocked(useTranslateMissingMutation).mockReturnValue([translate] as unknown as ReturnType<
    typeof useTranslateMissingMutation
  >);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useMissingStrings', () => {
  it('batches the misses of one paint into a single request', async () => {
    translate.mockResolvedValue(translated(2));
    const { result } = setup();
    act(() => {
      result.current.report('Save');
      result.current.report('Cancel');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(399);
    });
    expect(translate).not.toHaveBeenCalled();

    await flushBatch();
    expect(translate).toHaveBeenCalledTimes(1);
    expect(translate).toHaveBeenCalledWith({
      variables: { locale: 'fr', sources: ['Save', 'Cancel'] },
    });
    expect(result.current.filled).toBe(1);
  });

  it('asks about a string only once per session', async () => {
    translate.mockResolvedValue(translated(0));
    const { result } = setup();
    act(() => result.current.report('Save'));
    await flushBatch();
    act(() => result.current.report('Save'));
    await flushBatch();
    expect(translate).toHaveBeenCalledTimes(1);
  });

  it('does not re-render when nothing came back', async () => {
    translate.mockResolvedValue({ data: { translateMissing: [] } });
    const { result } = setup();
    act(() => result.current.report('Save'));
    await flushBatch();
    expect(result.current.filled).toBe(0);
  });

  it('treats an answer with no data as nothing translated', async () => {
    translate.mockResolvedValue({});
    const { result } = setup();
    act(() => result.current.report('Save'));
    await flushBatch();
    expect(result.current.filled).toBe(0);
  });

  it('sends no more than fifty strings in one request', async () => {
    translate.mockResolvedValue(translated(1));
    const { result } = setup();
    const sources = Array.from({ length: 60 }, (_, i) => `String ${i}`);
    act(() => sources.forEach((source) => result.current.report(source)));
    await flushBatch();
    expect(translate.mock.calls[0][0].variables.sources).toEqual(sources.slice(0, 50));
  });

  it('collects nothing until it is enabled', async () => {
    const { result } = setup('fr', false);
    act(() => result.current.report('Save'));
    await flushBatch();
    expect(translate).not.toHaveBeenCalled();
  });

  it('logs a failed request and carries on', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('offline');
    translate.mockRejectedValue(failure);
    const { result } = setup();
    act(() => result.current.report('Save'));
    await flushBatch();
    expect(error).toHaveBeenCalledWith('Could not translate new strings', failure);
    expect(result.current.filled).toBe(0);
  });

  it('asks again after the locale changes', async () => {
    translate.mockResolvedValue(translated(0));
    const { result, rerender } = setup('fr');
    act(() => result.current.report('Save'));
    await flushBatch();
    rerender({ locale: 'de', enabled: true });
    act(() => result.current.report('Save'));
    await flushBatch();
    expect(translate).toHaveBeenLastCalledWith({ variables: { locale: 'de', sources: ['Save'] } });
    expect(translate).toHaveBeenCalledTimes(2);
  });

  it('drops a pending batch when the locale changes before it is sent', async () => {
    translate.mockResolvedValue(translated(0));
    const { result, rerender } = setup('fr');
    act(() => result.current.report('Save'));
    rerender({ locale: 'de', enabled: true });
    await flushBatch();
    expect(translate).not.toHaveBeenCalled();
  });

  it('cancels a pending batch on unmount', async () => {
    const { result, unmount } = setup();
    act(() => result.current.report('Save'));
    unmount();
    await vi.advanceTimersByTimeAsync(400);
    expect(translate).not.toHaveBeenCalled();
  });

  it('unmounts cleanly with nothing pending', () => {
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = setup();
    unmount();
    expect(clear).not.toHaveBeenCalled();
  });
});
