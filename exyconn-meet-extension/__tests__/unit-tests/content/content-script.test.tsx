// @vitest-environment-options {"url": "https://meet.google.com/abc-defg-hij"}
import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startController } from '../../../src/content/controller';
import { DEFAULT_PREFS } from '../../../src/storage/prefs';
import { ORG } from '../fake-portal';
import { IN_CALL, PRE_JOIN, peoplePanel, render } from '../fixtures/meet-dom';
import { SIGNED_IN, installBrowserGaps, testLogger, workerAnswering } from '../ui-helpers';

type Sent = Record<string, unknown>;

beforeEach(() => {
  installBrowserGaps();
  history.replaceState(null, '', '/abc-defg-hij');
  document.title = 'Meet - Weekly sync';
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
  document.querySelector('exyconn-meeting-assistant')?.remove();
});

const sentOf = (chrome: ReturnType<typeof workerAnswering>, type: string): Sent[] =>
  chrome.runtime.sendMessage.mock.calls.map(([m]) => m as Sent).filter((m) => m.type === type);

async function settle(): Promise<void> {
  await act(() => vi.advanceTimersByTimeAsync(1000));
}

describe('content controller', () => {
  it('says hello, then reports the call once per change', async () => {
    vi.useFakeTimers();
    const chrome = workerAnswering({ 'state/get': SIGNED_IN });
    render(IN_CALL);
    const stop = startController(testLogger());
    expect(sentOf(chrome, 'meet/hello')).toEqual([
      {
        type: 'meet/hello',
        page: {
          meetingCode: 'abc-defg-hij',
          url: 'https://meet.google.com/abc-defg-hij',
          title: 'Weekly sync',
        },
      },
    ]);
    await settle();
    expect(sentOf(chrome, 'meet/report')).toHaveLength(1);
    expect(sentOf(chrome, 'meet/report')[0].report).toMatchObject({
      meetingState: 'IN_MEETING',
      transcriptionState: 'UNKNOWN',
    });
    document.body.append(document.createElement('span'));
    await settle();
    expect(sentOf(chrome, 'meet/report')).toHaveLength(1);
    stop();
  });

  it('reads participants only when both the user and the company allow it', async () => {
    vi.useFakeTimers();
    const chrome = workerAnswering({ 'state/get': SIGNED_IN });
    render(peoplePanel(['Ravi']));
    const stop = startController(testLogger());
    await settle();
    expect(sentOf(chrome, 'meet/report').at(-1)?.report).toMatchObject({
      participants: [{ displayName: 'Ravi' }],
    });
    await act(() =>
      chrome.storage.sync.set({ prefs: { ...DEFAULT_PREFS, participantTracking: false } }),
    );
    await act(() => chrome.storage.local.set({ other: 1 }));
    document.body.append(document.createElement('span'));
    await settle();
    expect(sentOf(chrome, 'meet/report').at(-1)?.report).toMatchObject({ participants: [] });
    await act(() => chrome.storage.sync.set({ prefs: DEFAULT_PREFS }));
    chrome.runtime.onMessage.emit(
      {
        type: 'state/changed',
        state: {
          ...SIGNED_IN,
          auth: { signedIn: true, org: { ...ORG, participantTracking: false } },
        },
      },
      {},
      vi.fn(),
    );
    chrome.runtime.onMessage.emit({ type: 'something' }, {}, vi.fn());
    chrome.runtime.onMessage.emit('plain', {}, vi.fn());
    document.body.append(document.createElement('span'));
    await settle();
    expect(sentOf(chrome, 'meet/report').at(-1)?.report).toMatchObject({ participants: [] });
    chrome.runtime.onMessage.emit(
      { type: 'state/changed', state: { auth: { signedIn: false, org: null }, tab: null } },
      {},
      vi.fn(),
    );
    stop();
  });

  it("follows Meet's in-page navigation: away from a call, into another, and leaving", async () => {
    vi.useFakeTimers();
    const chrome = workerAnswering({
      'state/get': { auth: { signedIn: false, org: null }, tab: null },
    });
    render(PRE_JOIN);
    const stop = startController(testLogger());
    await settle();
    history.pushState(null, '', '/landing');
    document.body.append(document.createElement('span'));
    await settle();
    expect(sentOf(chrome, 'meet/gone')).toHaveLength(1);
    document.body.append(document.createElement('span'));
    await settle();
    history.pushState(null, '', '/xyz-abcd-efg');
    document.body.append(document.createElement('span'));
    await settle();
    expect(sentOf(chrome, 'meet/hello').map((m) => (m.page as Sent).meetingCode)).toEqual([
      'abc-defg-hij',
      'xyz-abcd-efg',
    ]);
    globalThis.dispatchEvent(new Event('pagehide'));
    expect(sentOf(chrome, 'meet/gone')).toHaveLength(2);
    stop();
  });

  it('stops quietly once the extension is reloaded under it, and logs failed reports', async () => {
    vi.useFakeTimers();
    const chrome = workerAnswering({
      'state/get': new Error('asleep'),
      'meet/hello': new Error('asleep'),
    });
    const logger = testLogger();
    chrome.storage.sync.get = vi.fn(() => Promise.reject(new Error('blocked')));
    render(IN_CALL);
    startController(logger);
    await settle();
    expect(logger.warn).toHaveBeenCalledWith(
      'The worker did not take a page report',
      expect.any(Error),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Could not read the assistant state',
      expect.any(Error),
    );
    expect(logger.warn).toHaveBeenCalledWith('Could not read settings', expect.any(Error));
    chrome.runtime.id = undefined;
    document.body.append(document.createElement('span'));
    const before = chrome.runtime.sendMessage.mock.calls.length;
    await settle();
    expect(chrome.runtime.sendMessage.mock.calls).toHaveLength(before);
  });

  it('does nothing on a page that is not a call', async () => {
    vi.useFakeTimers();
    history.replaceState(null, '', '/landing');
    const chrome = workerAnswering({ 'state/get': SIGNED_IN });
    render(PRE_JOIN);
    const stop = startController(testLogger());
    await settle();
    expect(sentOf(chrome, 'meet/hello')).toHaveLength(0);
    expect(sentOf(chrome, 'meet/report')).toHaveLength(0);
    stop();
  });
});

describe('content script entry', () => {
  it('mounts the assistant in a shadow root and tears down on a real unload only', async () => {
    vi.resetModules();
    workerAnswering({ 'state/get': SIGNED_IN });
    render(IN_CALL);
    await import('../../../src/content/index');
    const host = document.querySelector('exyconn-meeting-assistant');
    expect(host?.shadowRoot).not.toBeNull();
    expect(host).toHaveStyle({ position: 'fixed', zIndex: '999' });
    await waitFor(() => expect(host?.shadowRoot?.textContent).toContain('Assistant'));
    const cached = new Event('pagehide');
    Object.defineProperty(cached, 'persisted', { value: true });
    globalThis.dispatchEvent(cached);
    expect(document.querySelector('exyconn-meeting-assistant')).not.toBeNull();
    const unload = new Event('pagehide');
    Object.defineProperty(unload, 'persisted', { value: false });
    act(() => {
      globalThis.dispatchEvent(unload);
    });
    expect(document.querySelector('exyconn-meeting-assistant')).toBeNull();
  });
});
