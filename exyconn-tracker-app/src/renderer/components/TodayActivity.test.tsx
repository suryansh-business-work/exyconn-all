// @vitest-environment jsdom
import { useState, type ReactElement } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import TodayActivity from './TodayActivity';
import { trackerState } from '../a11y/tracker-fixture';
import { cleanup, installDomShims, mount } from '../a11y/render-harness';
import { buttonNamed, deferred, finish, overrideTracker, press } from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(cleanup);

const EMPTY_DAY = {
  activeMs: 0,
  idleMs: 0,
  keyCount: 0,
  mouseCount: 0,
  sessions: 0,
  screenshots: [],
  intervals: [],
};

/** Stands in for the dashboard: each press is a sync landing, i.e. a new `lastSyncAt`. */
function Host(): ReactElement {
  const [syncs, setSyncs] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setSyncs((count) => count + 1)}>
        Sync
      </button>
      <TodayActivity timezone="UTC" lastSyncAt={`sync-${syncs}`} />
    </>
  );
}

function skeletons(): number {
  return document.querySelectorAll('.MuiSkeleton-root').length;
}

describe('TodayActivity', () => {
  it('keeps the day on screen while a sync re-reads it — no skeleton flash', async () => {
    await mount(<Host />, trackerState('idle'));
    overrideTracker({ getDay: () => Promise.resolve(EMPTY_DAY) });
    await press(buttonNamed('Sync'));
    await finish(() => undefined);
    expect(document.body.textContent).toContain('Nothing has synced for this day yet.');

    const reread = deferred();
    overrideTracker({ getDay: () => reread.promise.then(() => EMPTY_DAY) });
    await press(buttonNamed('Sync'));
    expect(skeletons()).toBe(0);
    expect(document.body.textContent).toContain('Nothing has synced for this day yet.');
    await finish(reread.resolve);
  });
});
