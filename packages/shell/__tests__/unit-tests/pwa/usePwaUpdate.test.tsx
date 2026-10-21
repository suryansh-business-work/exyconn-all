import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { usePwaUpdate } from '@/pwa/usePwaUpdate';

/** A service worker the test moves through its states. */
class FakeWorker extends EventTarget {
  state = 'installing';
  readonly postMessage = vi.fn();
  moveTo(state: string) {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

class FakeRegistration extends EventTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
  readonly update = vi.fn<() => Promise<void>>(() => Promise.resolve());
  found(worker: FakeWorker | null) {
    this.installing = worker;
    this.dispatchEvent(new Event('updatefound'));
  }
}

class FakeContainer extends EventTarget {
  controller: object | null = null;
  readonly register = vi.fn<(url: string) => Promise<FakeRegistration>>();
}

const FIFTEEN_MINUTES = 15 * 60_000;

/** Sets what the tab reports as its visibility and announces the change. */
function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

let container: FakeContainer;
let registration: FakeRegistration;
const reload = vi.fn();

function stubServiceWorker() {
  vi.stubGlobal('navigator', { ...globalThis.navigator, serviceWorker: container });
}

/** Renders the hook and waits for registration to settle. */
async function renderRegistered() {
  const hook = renderHook(() => usePwaUpdate());
  await waitFor(() => expect(container.register).toHaveBeenCalledWith('/sw.js'));
  await act(async () => {
    await Promise.resolve();
  });
  return hook;
}

describe('usePwaUpdate', () => {
  beforeEach(() => {
    container = new FakeContainer();
    registration = new FakeRegistration();
    container.register.mockResolvedValue(registration);
    vi.stubGlobal('location', { ...globalThis.location, reload });
    reload.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  it('does nothing where there is no service worker support, and apply just reloads', () => {
    vi.stubGlobal('navigator', { ...globalThis.navigator, serviceWorker: undefined });
    const { result } = renderHook(() => usePwaUpdate());

    expect(result.current.ready).toBe(false);
    act(() => result.current.apply());
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('offers a build that was already waiting when the tab opened', async () => {
    registration.waiting = new FakeWorker();
    stubServiceWorker();

    const { result } = await renderRegistered();

    expect(result.current.ready).toBe(true);
  });

  it('offers a replacement build once it has installed, but not a first install', async () => {
    stubServiceWorker();
    const { result } = await renderRegistered();
    expect(result.current.ready).toBe(false);

    const first = new FakeWorker();
    act(() => registration.found(first));
    act(() => first.moveTo('installed'));
    expect(result.current.ready).toBe(false);

    container.controller = {};
    const next = new FakeWorker();
    act(() => registration.found(next));
    act(() => next.moveTo('activating'));
    expect(result.current.ready).toBe(false);
    act(() => next.moveTo('installed'));
    expect(result.current.ready).toBe(true);
  });

  it('ignores an update that reports no installing worker', async () => {
    stubServiceWorker();
    const { result } = await renderRegistered();

    act(() => registration.found(null));
    expect(result.current.ready).toBe(false);
  });

  it('asks the waiting worker to take over, and reloads once it controls the page', async () => {
    const worker = new FakeWorker();
    registration.waiting = worker;
    stubServiceWorker();
    const { result } = await renderRegistered();

    act(() => result.current.apply());

    expect(result.current.ready).toBe(false);
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reload).not.toHaveBeenCalled();
    container.dispatchEvent(new Event('controllerchange'));
    container.dispatchEvent(new Event('controllerchange'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('keeps working when registration is refused', async () => {
    container.register.mockRejectedValue(new Error('No worker in this build'));
    stubServiceWorker();

    const { result } = await renderRegistered();

    expect(result.current.ready).toBe(false);
  });

  it('does not offer a worker that arrives after unmount', async () => {
    let resolve: (value: FakeRegistration) => void = () => undefined;
    container.register.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    registration.waiting = new FakeWorker();
    stubServiceWorker();
    const { result, unmount } = renderHook(() => usePwaUpdate());

    unmount();
    await act(async () => {
      resolve(registration);
      await Promise.resolve();
    });

    expect(result.current.ready).toBe(false);
  });

  it('asks the server for a newer build every fifteen minutes while the tab is open', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    stubServiceWorker();
    const { unmount } = await renderRegistered();
    expect(registration.update).not.toHaveBeenCalled();

    vi.advanceTimersByTime(FIFTEEN_MINUTES - 1);
    expect(registration.update).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(registration.update).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(FIFTEEN_MINUTES);
    expect(registration.update).toHaveBeenCalledTimes(2);

    unmount();
    vi.advanceTimersByTime(FIFTEEN_MINUTES * 2);
    expect(registration.update).toHaveBeenCalledTimes(2);
  });

  it('checks again when the tab comes back into view, not when it is hidden', async () => {
    stubServiceWorker();
    const { unmount } = await renderRegistered();

    setVisibility('hidden');
    expect(registration.update).not.toHaveBeenCalled();
    setVisibility('visible');
    expect(registration.update).toHaveBeenCalledTimes(1);

    unmount();
    setVisibility('visible');
    expect(registration.update).toHaveBeenCalledTimes(1);
  });

  it('shrugs off a failed check and tries again on the next one', async () => {
    registration.update.mockRejectedValueOnce(new Error('offline'));
    stubServiceWorker();
    const { result } = await renderRegistered();

    await act(async () => {
      setVisibility('visible');
      await Promise.resolve();
    });
    setVisibility('visible');

    expect(registration.update).toHaveBeenCalledTimes(2);
    expect(result.current.ready).toBe(false);
  });

  it('starts no checks for a registration that settles after unmount', async () => {
    let resolve: (value: FakeRegistration) => void = () => undefined;
    container.register.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    stubServiceWorker();
    const { unmount } = renderHook(() => usePwaUpdate());

    unmount();
    await act(async () => {
      resolve(registration);
      await Promise.resolve();
    });
    setVisibility('visible');

    expect(registration.update).not.toHaveBeenCalled();
  });
});
