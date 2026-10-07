import { describe, expect, it } from 'vitest';
import { KEEP_ALIVE_TASK } from '../../../src/native/tracker-native';
import { registerKeepAliveTask, releaseKeepAlive } from '../../../src/tracker/keep-alive';
import { AppRegistry } from '../mocks/react-native/apis';

type TaskProvider = () => () => Promise<void>;

/** Registers the task and returns the function the foreground service would run. */
function registeredTask(): () => Promise<void> {
  registerKeepAliveTask();
  const [name, provider] = AppRegistry.registerHeadlessTask.mock.calls[0] as [string, TaskProvider];
  expect(name).toBe(KEEP_ALIVE_TASK);
  return provider();
}

/** Resolves true when `promise` has settled by the time queued microtasks have run. */
async function settled(promise: Promise<void>): Promise<boolean> {
  let done = false;
  promise.then(
    () => {
      done = true;
    },
    () => undefined,
  );
  await Promise.resolve();
  await Promise.resolve();
  return done;
}

describe('the keep-alive task', () => {
  it('registers under the name the foreground service starts', () => {
    registeredTask();
    expect(AppRegistry.registerHeadlessTask).toHaveBeenCalledTimes(1);
  });

  it('stays pending for the whole session', async () => {
    const running = registeredTask()();
    expect(await settled(running)).toBe(false);
    releaseKeepAlive();
  });

  it('ends once released, so the service can stop', async () => {
    const running = registeredTask()();
    releaseKeepAlive();
    expect(await settled(running)).toBe(true);
  });

  it('does nothing when released with no task running', () => {
    expect(() => {
      releaseKeepAlive();
      releaseKeepAlive();
    }).not.toThrow();
  });
});
