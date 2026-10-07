// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import DashboardScreen from '../../../../src/renderer/screens/DashboardScreen';
import { buttonNamed, cleanup, installDomShims, mount, trackerState } from '../../test-utils';

beforeAll(installDomShims);
afterEach(cleanup);

function pickerLockNotice(): boolean {
  return (document.body.textContent ?? '').includes(
    'Locked while tracking — stop to book to another project.',
  );
}

describe('DashboardScreen', () => {
  it('names who is signed in, and leaves the booking open while idle', async () => {
    const state = trackerState('idle');
    await mount(<DashboardScreen state={state} />, state);
    const text = document.body.textContent ?? '';
    expect(text).toContain('Asha Rao');
    expect(text).toContain('asha@example.com');
    expect(pickerLockNotice()).toBe(false);
  });

  it('keeps the booking locked while a session is paused, not only while it runs', async () => {
    const state = trackerState('paused');
    await mount(<DashboardScreen state={state} />, state);
    expect(pickerLockNotice()).toBe(true);
    expect(buttonNamed('Resume').disabled).toBe(false);
  });

  it('keeps the live session counters apart from the all-time totals', async () => {
    const state = {
      ...trackerState('tracking'),
      stats: { ...trackerState('tracking').stats, keyCount: 42, sessionActiveMs: 120_000 },
    };
    await mount(<DashboardScreen state={state} />, state);
    const text = document.body.textContent ?? '';
    expect(text).toContain('This session');
    expect(text).toContain('Live counters for the run in progress');
    expect(text).toContain('Key presses');
    expect(text).toContain('42');
    expect(text).toContain('0h 2m 0s');
  });
});
