import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { PreviewCampaignContentDocument } from '@exyconn/shell/graphql/generated';
import { useCampaignPreview } from '../../../../../../../src/pages/marketing/forms/campaign/design/useCampaignPreview';

const apollo = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => apollo,
}));

const INPUT = {
  campaignName: 'Diwali offer',
  senderName: 'Exyconn',
  subject: 'Hi {{contact.firstName|there}}',
  preheader: '',
  mjml: '<mjml></mjml>',
  recordKind: null,
  recordId: null,
};

const PREVIEW = {
  html: '<p>Hi Asha</p>',
  text: 'Hi Asha',
  subject: 'Hi Asha',
  preheader: '',
  issues: [],
  missingVariables: [],
  recipient: { kind: 'SAMPLE', name: 'Asha', email: 'asha@example.com' },
};

const settle = (ms = 500) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe('useCampaignPreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    apollo.query.mockResolvedValue({ data: { previewCampaignContent: PREVIEW } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for nothing while the step shows no preview', async () => {
    const { result } = renderHook(() => useCampaignPreview(null));
    await settle(2000);
    expect(apollo.query).not.toHaveBeenCalled();
    expect(result.current).toEqual({ preview: null, updating: false, error: null });
  });

  it('renders the email on the server once typing pauses', async () => {
    const { result } = renderHook(() => useCampaignPreview(INPUT));
    expect(result.current.updating).toBe(true);
    await settle(499);
    expect(apollo.query).not.toHaveBeenCalled();
    await settle(1);
    expect(apollo.query).toHaveBeenCalledWith({
      query: PreviewCampaignContentDocument,
      variables: { input: INPUT },
      fetchPolicy: 'network-only',
      context: { fetchOptions: { signal: expect.any(AbortSignal) } },
    });
    expect(result.current).toEqual({ preview: PREVIEW, updating: false, error: null });
  });

  it('compiles only the latest input and aborts the one it replaced', async () => {
    let firstSignal: AbortSignal | undefined;
    let resolveFirst: (value: unknown) => void = () => undefined;
    apollo.query.mockImplementationOnce(({ context }) => {
      firstSignal = context.fetchOptions.signal;
      return new Promise((resolve) => {
        resolveFirst = resolve;
      });
    });
    const { result, rerender } = renderHook(({ input }) => useCampaignPreview(input), {
      initialProps: { input: INPUT },
    });
    await settle();
    rerender({ input: { ...INPUT, subject: 'Newer' } });
    expect(firstSignal?.aborted).toBe(true);
    const stale = { ...PREVIEW, subject: 'Stale' };
    await act(async () => {
      resolveFirst({ data: { previewCampaignContent: stale } });
    });
    expect(result.current.preview).toBeNull();
    await settle();
    expect(apollo.query).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { input: { ...INPUT, subject: 'Newer' } } }),
    );
    expect(result.current.preview).toEqual(PREVIEW);
  });

  it('keeps the last render but marks it out of date while a change compiles', async () => {
    const { result, rerender } = renderHook(({ input }) => useCampaignPreview(input), {
      initialProps: { input: INPUT },
    });
    await settle();
    rerender({ input: { ...INPUT, preheader: 'More' } });
    expect(result.current).toEqual({ preview: PREVIEW, updating: true, error: null });
  });

  it('reports a render that failed, keeping the last good preview', async () => {
    const { result, rerender } = renderHook(({ input }) => useCampaignPreview(input), {
      initialProps: { input: INPUT },
    });
    await settle();
    apollo.query.mockRejectedValueOnce(new Error('Line 3: unclosed tag'));
    rerender({ input: { ...INPUT, mjml: '<mjml>' } });
    await settle();
    expect(result.current).toEqual({
      preview: PREVIEW,
      updating: false,
      error: 'Line 3: unclosed tag',
    });
  });

  it('uses a plain message for a failure without one', async () => {
    apollo.query.mockRejectedValueOnce('nope');
    const { result } = renderHook(() => useCampaignPreview(INPUT));
    await settle();
    expect(result.current.error).toBe('The preview could not be built.');
  });

  it('ignores a failure that lands after the input changed', async () => {
    let rejectFirst: (reason: unknown) => void = () => undefined;
    apollo.query.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );
    const { result, rerender } = renderHook(({ input }) => useCampaignPreview(input), {
      initialProps: { input: INPUT },
    });
    await settle();
    rerender({ input: { ...INPUT, subject: 'Newer' } });
    await act(async () => {
      rejectFirst(new Error('aborted'));
    });
    expect(result.current.error).toBeNull();
  });

  it('keeps the old state when the server answers without data', async () => {
    apollo.query.mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() => useCampaignPreview(INPUT));
    await settle();
    expect(result.current).toEqual({ preview: null, updating: true, error: null });
  });
});
