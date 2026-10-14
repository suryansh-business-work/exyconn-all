import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { WhatsappDemoEventInput } from '@exyconn/shell/graphql/generated';
import { useDemoAnalytics } from '../../../src/analytics/useDemoAnalytics';

const hooks = vi.hoisted(() => ({ record: vi.fn(), warn: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useRecordWhatsappDemoEventsMutation: () => [hooks.record],
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { warn: hooks.warn, error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const START = new Date('2026-10-07T10:00:00.000Z');

/** The events of the n-th batch sent. */
function batch(n: number): WhatsappDemoEventInput[] {
  return hooks.record.mock.calls[n][0].variables.events;
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  globalThis.sessionStorage.clear();
  hooks.record.mockResolvedValue({});
});
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});

describe('useDemoAnalytics', () => {
  it('opens the session with the device and viewport, sent on the next flush', async () => {
    renderHook(() => useDemoAnalytics());
    expect(hooks.record).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    const [event] = batch(0);
    expect(event).toEqual({
      id: expect.any(String),
      sessionId: globalThis.sessionStorage.getItem('exyconn.wa-demo.session'),
      type: 'SESSION_START',
      at: START.toISOString(),
      device: 'desktop',
      viewport: `${globalThis.innerWidth}x${globalThis.innerHeight}`,
    });
  });

  it('reports engine and screen signals with only the fields they carry', async () => {
    const { result } = renderHook(() => useDemoAnalytics());
    act(() => {
      result.current({ type: 'FLOW_STARTED', demoKey: 'clinic', workflow: 'book', node: 'n1' });
      result.current({
        type: 'STEP',
        demoKey: 'clinic',
        workflow: 'book',
        node: 'n2',
        stepKind: 'choice',
        label: 'x'.repeat(100),
      });
      result.current({ type: 'DEMO_OPENED', demoKey: 'clinic' });
      result.current({ type: 'QR_OPENED', demoKey: 'clinic', label: 'Gate pass' });
    });
    await vi.advanceTimersByTimeAsync(5000);
    const [, flow, step, opened, qr] = batch(0);
    expect(flow).toMatchObject({ type: 'FLOW_STARTED', demoKey: 'clinic', workflow: 'book' });
    expect(flow.node).toBe('n1');
    expect(step).toMatchObject({ type: 'STEP', stepKind: 'choice', label: 'x'.repeat(80) });
    expect(opened).toEqual(expect.objectContaining({ type: 'DEMO_OPENED', demoKey: 'clinic' }));
    expect(opened).not.toHaveProperty('workflow');
    expect(qr).toMatchObject({ type: 'QR_OPENED', label: 'Gate pass' });
    expect(new Set(batch(0).map((e) => e.id)).size).toBe(5);
  });

  it('ignores a signal the server has no event type for', async () => {
    const { result } = renderHook(() => useDemoAnalytics());
    act(() => {
      result.current({ type: 'NOT_A_SIGNAL', demoKey: 'clinic' } as never);
    });
    await vi.advanceTimersByTimeAsync(5000);
    expect(batch(0)).toHaveLength(1);
  });

  it('sends a full batch of twenty at once, without waiting for the timer', () => {
    const { result } = renderHook(() => useDemoAnalytics());
    act(() => {
      for (let i = 0; i < 19; i += 1) {
        result.current({ type: 'CHAT_CLEARED', demoKey: `demo-${i}` });
      }
    });
    expect(hooks.record).toHaveBeenCalledTimes(1);
    expect(batch(0)).toHaveLength(20);
  });

  it('sends nothing when there is nothing queued', async () => {
    renderHook(() => useDemoAnalytics());
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);
    expect(hooks.record).toHaveBeenCalledTimes(1);
  });

  it('keeps a batch that failed and sends it again with the next one', async () => {
    const failure = new Error('offline');
    hooks.record.mockRejectedValueOnce(failure);
    const { result } = renderHook(() => useDemoAnalytics());
    await vi.advanceTimersByTimeAsync(5000);
    expect(hooks.warn).toHaveBeenCalledWith('wa-demo: analytics batch not sent', failure);
    act(() => {
      result.current({ type: 'DEMO_OPENED', demoKey: 'clinic' });
    });
    await vi.advanceTimersByTimeAsync(5000);
    expect(batch(1).map((e) => e.type)).toEqual(['SESSION_START', 'DEMO_OPENED']);
    expect(batch(1)[0].id).toBe(batch(0)[0].id);
  });

  it('ends the session with its duration when the tab is hidden', async () => {
    renderHook(() => useDemoAnalytics());
    await vi.advanceTimersByTimeAsync(5000);
    act(() => setVisibility('visible'));
    expect(hooks.record).toHaveBeenCalledTimes(1);
    vi.setSystemTime(START.getTime() + 42_000);
    act(() => setVisibility('hidden'));
    expect(hooks.record).toHaveBeenCalledTimes(2);
    expect(batch(1)).toEqual([
      expect.objectContaining({ type: 'SESSION_END', durationMs: 42_000 }),
    ]);
  });

  it('flushes what is left on unmount and stops the timer', async () => {
    const { unmount } = renderHook(() => useDemoAnalytics());
    unmount();
    expect(hooks.record).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(20_000);
    setVisibility('hidden');
    expect(hooks.record).toHaveBeenCalledTimes(1);
  });
});
