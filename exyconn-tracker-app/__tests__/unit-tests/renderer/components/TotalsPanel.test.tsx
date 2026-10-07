// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import TotalsPanel from '../../../../src/renderer/components/TotalsPanel';
import { button, flush, render, stubTracker, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

describe('TotalsPanel', () => {
  it('heads the block as all-time, then lays the totals out as tiles', async () => {
    stubTracker({
      getTotals: () =>
        Promise.resolve({ activeMs: 7_200_000, idleMs: 900_000, screenshots: 12, sessions: 4 }),
    });
    await render(<TotalsPanel lastSyncAt="2026-09-14T10:30:00.000Z" />);
    await flush();
    expect(document.querySelector('h2')?.textContent).toBe('All time');
    expect(pageText()).toContain('it never resets');
    expect(document.querySelector('[aria-label="Loading your all-time totals"]')).toBeNull();
    expect(button('Total worked: 2h 0m. Open details')).toBeDefined();
    expect(button('Sessions: 4. Open details')).toBeDefined();
  });
});
