import { describe, expect, it, vi } from 'vitest';
import { appStateIdleSeconds } from '../../../../src/tracker/idle/app-state-idle';
import {
  CAPTURE_DECLINED,
  capabilities,
  createEngineDeps,
  lastCaptureDimensions,
  portal,
} from '../../../../src/tracker/platform';
import * as android from '../../../../src/tracker/platform/android';
import { fakeContext } from './android-fixtures';

vi.mock('../../../../src/tracker/platform/shared', () => ({
  portal: { name: 'portal' },
  baseDeps: () => ({ portal: 'portal', outbox: 'outbox', input: 'input' }),
}));

/** iOS, the stubs' default platform: the app on screen is the only signal there is. */
describe('the iPhone platform', () => {
  it('can observe time and nothing else', () => {
    expect(capabilities).toEqual({
      screenshots: false,
      foregroundApp: false,
      inputCounts: false,
      webcam: false,
      background: false,
    });
  });

  it('reads idle from the app state, sees no other app and captures nothing', async () => {
    const deps = createEngineDeps(fakeContext().context);
    expect(deps).toMatchObject({ portal: 'portal', outbox: 'outbox', input: 'input' });
    expect(deps.idleSeconds).toBe(appStateIdleSeconds);
    await expect(deps.foreground.sample(1)).resolves.toBe('');
    expect(deps.foreground.drain(2, true)).toEqual([]);
    await expect(deps.capture(fakeContext().context.settings())).resolves.toEqual([]);
    expect(deps.session).toBeUndefined();
  });

  it('re-exports the portal and the Android capture helpers', () => {
    expect(portal).toEqual({ name: 'portal' });
    expect(CAPTURE_DECLINED).toBe(android.CAPTURE_DECLINED);
    expect(lastCaptureDimensions).toBe(android.lastCaptureDimensions);
  });
});
