// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import TrackingControls from './TrackingControls';
import { trackerState } from '../a11y/tracker-fixture';
import { cleanup, installDomShims, mount } from '../a11y/render-harness';
import {
  buttonNamed,
  deferred,
  errorText,
  finish,
  isLoading,
  overrideTracker,
  press,
} from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(cleanup);

describe('TrackingControls', () => {
  it('spins on the pressed button and holds the others until the command answers', async () => {
    await mount(<TrackingControls status="tracking" attendanceMarked />, trackerState('tracking'));
    const pause = deferred();
    overrideTracker({ pause: () => pause.promise });

    await press(buttonNamed('Pause'));
    expect(isLoading(buttonNamed('Pause'))).toBe(true);
    expect(buttonNamed('Stop').disabled).toBe(true);

    await finish(pause.resolve);
    expect(isLoading(buttonNamed('Pause'))).toBe(false);
    expect(buttonNamed('Stop').disabled).toBe(false);
    expect(errorText()).toBeUndefined();
  });

  it('shows the controller’s own reason when a command is refused', async () => {
    await mount(<TrackingControls status="idle" attendanceMarked />, trackerState('idle'));
    overrideTracker({
      start: () =>
        Promise.reject(
          new Error("Error invoking remote method 'tracker:start': Error: Portal unreachable."),
        ),
    });

    await press(buttonNamed('Start'));
    await finish(() => undefined);
    expect(errorText()).toBe('Portal unreachable.');
    expect(buttonNamed('Start').disabled).toBe(false);
  });

  it('runs resume and stop from a paused session', async () => {
    await mount(<TrackingControls status="paused" attendanceMarked />, trackerState('paused'));
    const calls: string[] = [];
    overrideTracker({
      resume: () => Promise.resolve(calls.push('resume')),
      stop: () => Promise.resolve(calls.push('stop')),
    });
    await press(buttonNamed('Resume'));
    await finish(() => undefined);
    await press(buttonNamed('Stop'));
    await finish(() => undefined);
    expect(calls).toEqual(['resume', 'stop']);
  });
});
