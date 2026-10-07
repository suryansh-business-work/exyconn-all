import { afterEach, describe, expect, it, vi } from 'vitest';
import { portal } from '../../../src/tracker/platform';
import { scheduleUpdateChecks, subscribeUpdate } from '../../../src/tracker/updates';

vi.mock('../../../src/tracker/platform', () => ({ portal: { fetchLatestRelease: vi.fn() } }));

const fetchLatest = vi.mocked(portal.fetchLatestRelease);
const SIX_HOURS = 6 * 60 * 60 * 1000;

afterEach(() => {
  scheduleUpdateChecks(false);
  vi.restoreAllMocks();
});

describe('scheduleUpdateChecks', () => {
  it('checks at sign-in and again every six hours', async () => {
    vi.useFakeTimers();
    fetchLatest.mockResolvedValue(null);
    scheduleUpdateChecks(true);
    expect(fetchLatest).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(SIX_HOURS);
    expect(fetchLatest).toHaveBeenCalledTimes(2);
  });

  it('never runs two schedules for one sign-in', async () => {
    vi.useFakeTimers();
    fetchLatest.mockResolvedValue(null);
    scheduleUpdateChecks(true);
    scheduleUpdateChecks(true);
    await vi.advanceTimersByTimeAsync(SIX_HOURS);
    expect(fetchLatest).toHaveBeenCalledTimes(2);
  });

  it('stops checking at sign-out, and a second sign-out is harmless', async () => {
    vi.useFakeTimers();
    fetchLatest.mockResolvedValue(null);
    scheduleUpdateChecks(true);
    scheduleUpdateChecks(false);
    scheduleUpdateChecks(false);
    await vi.advanceTimersByTimeAsync(SIX_HOURS * 2);
    expect(fetchLatest).toHaveBeenCalledTimes(1);
  });

  it('logs a check that fails outright, at sign-in and on the timer', async () => {
    vi.useFakeTimers();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = new Error('listener failed');
    const unsubscribe = subscribeUpdate(() => {
      throw broken;
    });
    scheduleUpdateChecks(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(error).toHaveBeenCalledWith('Update check failed', broken);
    error.mockClear();
    await vi.advanceTimersByTimeAsync(SIX_HOURS);
    expect(error).toHaveBeenCalledWith('Update check failed', broken);
    unsubscribe();
    expect(fetchLatest).not.toHaveBeenCalled();
  });
});
