import { inTurn } from '../../../src/lib/inTurn';

/** A promise the test settles by hand, so the order of work is visible. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

describe('inTurn', () => {
  it('runs one key’s work strictly one piece after another', async () => {
    const order: string[] = [];
    const first = deferred<string>();
    const a = inTurn('chat-1', () => {
      order.push('a:start');
      return first.promise;
    });
    const b = inTurn('chat-1', async () => {
      order.push('b:start');
      return 'b';
    });
    await tick();
    expect(order).toEqual(['a:start']);

    first.resolve('a');
    await expect(a).resolves.toBe('a');
    await expect(b).resolves.toBe('b');
    expect(order).toEqual(['a:start', 'b:start']);
  });

  it('carries on with the next piece when the previous one failed', async () => {
    const failing = inTurn('chat-2', async () => {
      throw new Error('first failed');
    });
    const next = inTurn('chat-2', async () => 'recovered');
    await expect(failing).rejects.toThrow('first failed');
    await expect(next).resolves.toBe('recovered');
  });

  it('runs different keys side by side', async () => {
    const blocker = deferred<void>();
    const slow = inTurn('chat-3', () => blocker.promise);
    const fast = inTurn('chat-4', async () => 'fast');
    await expect(fast).resolves.toBe('fast');
    blocker.resolve();
    await expect(slow).resolves.toBeUndefined();
  });

  it('starts afresh once a key’s queue has drained', async () => {
    await inTurn('chat-5', async () => 1);
    await tick();
    const started = jest.fn(async () => 2);
    await expect(inTurn('chat-5', started)).resolves.toBe(2);
    expect(started).toHaveBeenCalledTimes(1);
  });
});
