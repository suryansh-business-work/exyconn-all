import { describe, expect, it, vi } from 'vitest';
import { KEEP_ALIVE_TASK } from '../../../src/native/tracker-native';

describe('the tracker-native module', () => {
  it('is looked up by name, optionally, so iOS gets null instead of a crash', async () => {
    // The lookup runs at import, and vitest clears spy calls before each test: import afresh.
    vi.resetModules();
    const { requireOptionalNativeModule } = await import('../mocks/expo');
    const { TrackerNative } = await import('../../../src/native/tracker-native');
    expect(requireOptionalNativeModule).toHaveBeenCalledWith('TrackerNative');
    expect(TrackerNative).toBeNull();
  });

  it('names the headless task the foreground service runs', () => {
    expect(KEEP_ALIVE_TASK).toBe('ExyconnTrackerKeepAlive');
  });
});
