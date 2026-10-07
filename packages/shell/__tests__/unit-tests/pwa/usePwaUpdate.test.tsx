import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePwaUpdate } from '@/pwa/usePwaUpdate';
import { PwaUpdateBanner } from '@/pwa/PwaUpdateBanner';
import { renderWithProviders } from '../test-utils';

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
  found(worker: FakeWorker | null) {
    this.installing = worker;
    this.dispatchEvent(new Event('updatefound'));
  }
}

class FakeContainer extends EventTarget {
  controller: object | null = null;
  readonly register = vi.fn<(url: string) => Promise<FakeRegistration>>();
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
});

describe('PwaUpdateBanner', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('announces a waiting build and applies it from the Reload button', async () => {
    const worker = new FakeWorker();
    const reg = new FakeRegistration();
    reg.waiting = worker;
    const sw = new FakeContainer();
    sw.register.mockResolvedValue(reg);
    vi.stubGlobal('navigator', { ...globalThis.navigator, serviceWorker: sw });

    renderWithProviders(<PwaUpdateBanner />);

    expect(await screen.findByText('A new version of this portal is ready.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });
});
