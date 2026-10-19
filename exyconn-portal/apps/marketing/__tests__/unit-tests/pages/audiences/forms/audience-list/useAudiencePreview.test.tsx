import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  PreviewAudienceCountsDocument,
  type AudienceListInput,
} from '@exyconn/shell/graphql/generated';
import { useAudiencePreview } from '../../../../../../src/pages/audiences/forms/audience-list/useAudiencePreview';
import {
  toFormValues,
  toInput,
} from '../../../../../../src/pages/audiences/forms/audience-list/audience-list.types';
import { renderHookWithProviders } from '../../../../test-utils';
import { audienceCounts } from '../../audience.fixtures';
import { renderHook } from '@testing-library/react';
import { createWrapper } from '../../../../test-utils';

const apollo = vi.hoisted(() => {
  const query = vi.fn();
  return { query, client: { query } };
});

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => apollo.client,
}));

const INPUT: AudienceListInput = toInput({ ...toFormValues(null), name: 'Cafés' });
const RESOLVED_AT = '2026-10-20T09:00:00.000Z';

const answer = (eligible: number, resolvedAt = RESOLVED_AT) => ({
  data: { previewAudience: { resolvedAt, counts: audienceCounts({ eligible }) } },
});

/** A query whose answer the test hands over when it chooses. */
function deferred() {
  let resolve: (value: unknown) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** Lets the debounce run out and any answered query settle. */
async function settle(ms = 400) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function renderPreview(input: AudienceListInput = INPUT) {
  return renderHook(({ value }) => useAudiencePreview(value), {
    initialProps: { value: input },
    wrapper: createWrapper(),
  });
}

describe('useAudiencePreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apollo.query.mockReset();
    apollo.query.mockResolvedValue(answer(1430));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is updating, with no figures, until the first answer', () => {
    const { result } = renderPreview();

    expect(result.current).toMatchObject({
      counts: null,
      resolvedAt: null,
      updating: true,
      error: null,
    });
  });

  it('waits for the settings to stop changing, then asks the server once', async () => {
    const { result } = renderPreview();

    await settle(399);
    expect(apollo.query).not.toHaveBeenCalled();
    await settle(1);

    expect(apollo.query).toHaveBeenCalledTimes(1);
    expect(apollo.query).toHaveBeenCalledWith({
      query: PreviewAudienceCountsDocument,
      variables: { input: INPUT },
      fetchPolicy: 'network-only',
      context: { fetchOptions: { signal: expect.any(AbortSignal) } },
    });
    expect(result.current).toMatchObject({
      counts: audienceCounts({ eligible: 1430 }),
      resolvedAt: RESOLVED_AT,
      updating: false,
      error: null,
    });
  });

  it('asks only for the last of several quick changes', async () => {
    const { rerender } = renderPreview();

    await settle(200);
    rerender({ value: { ...INPUT, name: 'Cafés in Delhi' } });
    await settle(200);
    rerender({ value: { ...INPUT, name: 'Cafés in Pune' } });
    await settle();

    expect(apollo.query).toHaveBeenCalledTimes(1);
    expect(apollo.query.mock.calls[0][0].variables.input.name).toBe('Cafés in Pune');
  });

  it('does not ask again when the settings are equal but a new object', async () => {
    const { rerender } = renderPreview();
    await settle();

    rerender({ value: { ...INPUT } });
    await settle();

    expect(apollo.query).toHaveBeenCalledTimes(1);
  });

  it('drops an answer for settings the form no longer has', async () => {
    const first = deferred();
    apollo.query.mockReturnValueOnce(first.promise);
    const { result, rerender } = renderPreview();
    await settle();
    const firstSignal = apollo.query.mock.calls[0][0].context.fetchOptions.signal as AbortSignal;

    rerender({ value: { ...INPUT, name: 'Changed' } });
    expect(firstSignal.aborted).toBe(true);
    expect(result.current.updating).toBe(true);
    await act(async () => {
      first.resolve(answer(5));
    });
    expect(result.current.counts).toBeNull();

    await settle();
    expect(result.current.counts?.eligible).toBe(1430);
  });

  it('ignores a failure of a request it has already abandoned', async () => {
    const first = deferred();
    apollo.query.mockReturnValueOnce(first.promise);
    const { result, rerender } = renderPreview();
    await settle();

    rerender({ value: { ...INPUT, name: 'Changed' } });
    await act(async () => {
      first.reject(new Error('aborted'));
    });

    expect(result.current.error).toBeNull();
    expect(result.current.updating).toBe(true);
  });

  it('keeps the last figures and reports the server error', async () => {
    const { result, rerender } = renderPreview();
    await settle();
    apollo.query.mockRejectedValueOnce(new Error('Audience preview timed out'));

    rerender({ value: { ...INPUT, name: 'Changed' } });
    await settle();

    expect(result.current).toMatchObject({
      counts: audienceCounts({ eligible: 1430 }),
      updating: false,
      error: 'Audience preview timed out',
    });
  });

  it('says the counts could not be updated when the failure has no message', async () => {
    apollo.query.mockRejectedValueOnce('offline');
    const { result } = renderPreview();

    await settle();

    expect(result.current.error).toBe('The counts could not be updated.');
    expect(result.current.updating).toBe(false);
  });

  it('asks again on retry, clearing the error while it waits', async () => {
    apollo.query.mockRejectedValueOnce(new Error('Busy'));
    const { result } = renderPreview();
    await settle();
    expect(result.current.error).toBe('Busy');

    act(() => {
      result.current.retry();
    });
    expect(result.current).toMatchObject({ error: null, updating: true });
    await settle();

    expect(apollo.query).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ error: null, updating: false });
    expect(result.current.counts?.eligible).toBe(1430);
  });

  it('stays updating when the server answers without data', async () => {
    apollo.query.mockResolvedValueOnce({ data: undefined });
    const { result } = renderPreview();

    await settle();

    expect(result.current).toMatchObject({ counts: null, updating: true, error: null });
  });

  it('abandons the request when the form closes', async () => {
    const first = deferred();
    apollo.query.mockReturnValueOnce(first.promise);
    const { unmount } = renderPreview();
    await settle();
    const signal = apollo.query.mock.calls[0][0].context.fetchOptions.signal as AbortSignal;

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it('never asks when the form closes before the wait is over', async () => {
    const { unmount } = renderHookWithProviders(() => useAudiencePreview(INPUT));

    unmount();
    await settle();

    expect(apollo.query).not.toHaveBeenCalled();
  });
});
