import { messageOf as coreMessageOf } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { messageOf, run } from '../../../src/tracker/run';

describe('run', () => {
  it('fires the command without logging when it succeeds', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const action = vi.fn(() => Promise.resolve('done'));
    run(action);
    expect(action).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('logs a failed command instead of swallowing it', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('portal unreachable');
    run(() => Promise.reject(cause));
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('Tracker action failed', cause));
    error.mockRestore();
  });

  it('reads a failure the way the desktop does', () => {
    expect(messageOf).toBe(coreMessageOf);
  });
});
