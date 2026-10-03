// @vitest-environment jsdom
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import TotalsPanel from './TotalsPanel';
import { installTracker, trackerState } from '../a11y/tracker-fixture';
import { installDomShims, settle } from '../a11y/render-harness';
import { deferred, overrideTracker } from '../a11y/component-harness';

beforeAll(installDomShims);

let root: ReturnType<typeof createRoot> | null = null;
afterEach(() => {
  act(() => root?.unmount());
  document.body.innerHTML = '';
});

/** Renders with `getTotals` answered by `answer` from the very first read. */
async function render(answer: () => Promise<unknown>): Promise<void> {
  installTracker(trackerState('idle'));
  overrideTracker({ getTotals: answer });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(<TotalsPanel lastSyncAt={null} />));
}

describe('TotalsPanel', () => {
  it('holds labelled placeholder tiles until the first answer', async () => {
    const totals = deferred();
    await render(() => totals.promise);
    expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe(
      'Loading your all-time totals',
    );
  });

  it('says so, instead of spinning forever, when the totals cannot be read', async () => {
    await render(() => Promise.reject(new Error('offline')));
    await settle();
    expect(document.querySelector('[role="progressbar"]')).toBeNull();
    expect(document.body.textContent).toContain('Could not load your all-time totals.');
  });
});
