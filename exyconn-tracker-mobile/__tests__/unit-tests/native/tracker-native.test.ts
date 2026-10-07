import { describe, expect, it } from 'vitest';
import { KEEP_ALIVE_TASK, TrackerNative } from '../../../src/native/tracker-native';
import { requireOptionalNativeModule } from '../mocks/expo';

describe('the tracker-native module', () => {
  it('is looked up by name, optionally, so iOS gets null instead of a crash', () => {
    expect(requireOptionalNativeModule).toHaveBeenCalledWith('TrackerNative');
    expect(TrackerNative).toBeNull();
  });

  it('names the headless task the foreground service runs', () => {
    expect(KEEP_ALIVE_TASK).toBe('ExyconnTrackerKeepAlive');
  });
});
