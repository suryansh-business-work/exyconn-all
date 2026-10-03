import { describe, expect, it, vi } from 'vitest';
import { messageOf, run } from './run';

describe('messageOf', () => {
  it('drops the wrapper Electron puts round a main-process error', () => {
    const cause = new Error(
      "Error invoking remote method 'tracker:start': Error: Mark your attendance first.",
    );
    expect(messageOf(cause, 'Could not start tracking.')).toBe('Mark your attendance first.');
  });

  it('keeps a plain error as it is, and falls back when there is nothing to say', () => {
    expect(messageOf(new Error('Offline'), 'fallback')).toBe('Offline');
    expect(messageOf(new Error("Error invoking remote method 'x': "), 'fallback')).toBe('fallback');
    expect(messageOf(null, 'fallback')).toBe('fallback');
  });
});

describe('run', () => {
  it('logs a failure instead of leaving it unhandled', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('boom');
    run(() => Promise.reject(failure));
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith('Tracker action failed', failure));
    log.mockRestore();
  });
});
