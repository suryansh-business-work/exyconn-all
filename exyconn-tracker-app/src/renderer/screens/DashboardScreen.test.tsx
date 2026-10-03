// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import DashboardScreen from './DashboardScreen';
import { trackerState } from '../a11y/tracker-fixture';
import { cleanup, installDomShims, mount } from '../a11y/render-harness';
import { buttonNamed } from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(cleanup);

describe('DashboardScreen', () => {
  it('shows loaders, not gaps, while the portal has not yet sent today or the tickets', async () => {
    const state = {
      ...trackerState('idle'),
      user: null,
      workday: null,
      projects: [],
      tasks: [],
      tasksLoading: true,
    };
    await mount(<DashboardScreen state={state} />, state);
    const text = document.body.textContent ?? '';
    expect(text).toContain('Signed in');
    expect(text).toContain('Checking today’s attendance…');
    expect(text).toContain('Loading projects…');
    expect(text).toContain('Loading tickets…');
    // Not marked in — as far as anyone knows yet — so Start cannot be pressed.
    expect(buttonNamed('Start').disabled).toBe(true);
  });

  it('locks the booking while a session runs', async () => {
    const state = trackerState('tracking');
    await mount(<DashboardScreen state={state} />, state);
    expect(document.body.textContent).toContain(
      'Locked while tracking — stop to book to another project.',
    );
    expect(buttonNamed('Pause').disabled).toBe(false);
  });
});
