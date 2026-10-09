// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  installDomShims,
  installTracker,
  overrideTracker,
  render,
  settle,
  trackerState,
  unmountAll,
} from '../test-utils';

// The gallery reads its day from its own URL once, at import — so the URL is set first.
vi.hoisted(() => {
  globalThis.history.replaceState(
    null,
    '',
    '/screenshots.html?start=2026-09-14T00%3A00%3A00.000Z&end=2026-09-15T00%3A00%3A00.000Z',
  );
});

vi.mock('../../../src/renderer/screens/ScreenshotsScreen', () => ({
  default: (props: Readonly<{ startISO: string; endISO: string; timezone: string }>) => (
    <p data-testid="gallery" data-start={props.startISO} data-end={props.endISO}>
      {props.timezone}
    </p>
  ),
}));

import ScreenshotsApp from '../../../src/renderer/ScreenshotsApp';

const gallery = () => document.querySelector<HTMLElement>('[data-testid="gallery"]');

beforeAll(installDomShims);

afterEach(unmountAll);

describe('ScreenshotsApp', { timeout: 30_000 }, () => {
  it('opens on the day its URL names, in the employee’s zone, under its own title bar', async () => {
    installTracker({ ...trackerState('idle'), timezone: 'Asia/Kolkata' });

    await render(<ScreenshotsApp />);
    await settle();

    expect(gallery()?.dataset.start).toBe('2026-09-14T00:00:00.000Z');
    expect(gallery()?.dataset.end).toBe('2026-09-15T00:00:00.000Z');
    expect(gallery()?.textContent).toBe('Asia/Kolkata');
    expect(document.body.textContent).toContain('My screenshots — Exyconn Tracker');
  });

  it('shows a spinner until it knows the zone and theme', async () => {
    installTracker(trackerState('idle'));
    overrideTracker({ getState: () => new Promise<never>(() => undefined) });

    await render(<ScreenshotsApp />);
    await settle();

    expect(gallery()).toBeNull();
    expect(document.querySelector('[role="progressbar"]')).not.toBeNull();
  });
});
