import { runInNewContext } from 'node:vm';
import { docker, DockerUnavailableError } from '../../../../src/modules/infra/docker.client';

// The engine address is read once at import; point it at a fictional socket proxy so every
// read actually reaches the (stubbed) network instead of failing on configuration.
jest.mock('../../../../src/config/env', () => {
  const actual = jest.requireActual('../../../../src/config/env');
  return { env: { ...actual.env, dockerApiUrl: 'http://docker-proxy.test:2375' } };
});

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Replaces fetch with one that answers every call through `handler`, recording the calls. */
function stubFetch(handler: () => Promise<Response>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return handler();
  }) as unknown as typeof fetch;
  return calls;
}

/** A fetch that never answers on its own, only failing once its signal is aborted. */
function hangingFetch() {
  const signals: AbortSignal[] = [];
  globalThis.fetch = ((_url: string, init: RequestInit) => {
    const signal = init.signal as AbortSignal;
    signals.push(signal);
    return new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('This operation was aborted')));
    });
  }) as unknown as typeof fetch;
  return signals;
}

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('docker client reads', () => {
  it('reads each engine endpoint at its documented path', async () => {
    const calls = stubFetch(() => json({ ok: true }));

    await docker.version();
    await docker.info();
    await docker.containers();
    await docker.inspect('abc123');
    await docker.images();
    await docker.diskUsage();
    await docker.stats('abc123');

    expect(calls.map((call) => call.url)).toEqual([
      'http://docker-proxy.test:2375/version',
      'http://docker-proxy.test:2375/info',
      'http://docker-proxy.test:2375/containers/json?all=1',
      'http://docker-proxy.test:2375/containers/abc123/json',
      'http://docker-proxy.test:2375/images/json',
      'http://docker-proxy.test:2375/system/df',
      'http://docker-proxy.test:2375/containers/abc123/stats?stream=false',
    ]);
    // GET only: the client never sends a method, so nothing can mutate the host stack.
    expect(calls.every((call) => call.init.method === undefined)).toBe(true);
  });

  it('returns the parsed JSON body of a successful read', async () => {
    stubFetch(() => json({ Version: '27.1.1', ApiVersion: '1.46' }));

    await expect(docker.version()).resolves.toEqual({ Version: '27.1.1', ApiVersion: '1.46' });
  });

  it('reports a non-2xx answer with its status and path', async () => {
    stubFetch(() => json({ message: 'denied' }, 403));

    const failure = docker.info();

    await expect(failure).rejects.toBeInstanceOf(DockerUnavailableError);
    await expect(docker.info()).rejects.toThrow('Docker engine answered HTTP 403 for /info');
  });

  it('wraps a network error with its reason', async () => {
    stubFetch(() => Promise.reject(new Error('connect ECONNREFUSED')));

    await expect(docker.images()).rejects.toThrow(
      'Could not reach the Docker engine: connect ECONNREFUSED',
    );
  });

  it('names a generic reason when the failure is not an Error of this realm', async () => {
    // An error raised in another V8 context is not `instanceof Error` here, so its message
    // cannot be trusted to exist and the generic reason is used instead.
    const foreign: unknown = runInNewContext('new Error("socket hang up")');
    stubFetch(() => Promise.reject(foreign));

    const error = await docker.containers().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DockerUnavailableError);
    expect((error as Error).name).toBe('DockerUnavailableError');
    expect((error as Error).message).toBe('Could not reach the Docker engine: the request failed');
  });
});

/** Only the timers are faked: promise and stream plumbing keeps running on its own. */
const FAKE_TIMERS: Parameters<typeof jest.useFakeTimers>[0] = {
  doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate', 'clearImmediate'],
};

describe('docker client timeouts', () => {
  it('aborts an ordinary read after ten seconds', async () => {
    jest.useFakeTimers(FAKE_TIMERS);
    try {
      const signals = hangingFetch();
      const pending = docker.version();

      jest.advanceTimersByTime(9_999);
      expect(signals[0].aborted).toBe(false);
      jest.advanceTimersByTime(1);

      expect(signals[0].aborted).toBe(true);
      await expect(pending).rejects.toThrow(
        'Could not reach the Docker engine: This operation was aborted',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('gives the slow stats and disk-usage reads twenty seconds', async () => {
    jest.useFakeTimers(FAKE_TIMERS);
    try {
      const signals = hangingFetch();
      const stats = docker.stats('abc123');
      const disk = docker.diskUsage();

      jest.advanceTimersByTime(10_000);
      expect(signals.map((signal) => signal.aborted)).toEqual([false, false]);
      jest.advanceTimersByTime(10_000);

      expect(signals.map((signal) => signal.aborted)).toEqual([true, true]);
      await expect(stats).rejects.toBeInstanceOf(DockerUnavailableError);
      await expect(disk).rejects.toBeInstanceOf(DockerUnavailableError);
    } finally {
      jest.useRealTimers();
    }
  });

  it('clears its timer once the engine has answered', async () => {
    jest.useFakeTimers(FAKE_TIMERS);
    try {
      stubFetch(() => json({}));

      await docker.info();

      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
