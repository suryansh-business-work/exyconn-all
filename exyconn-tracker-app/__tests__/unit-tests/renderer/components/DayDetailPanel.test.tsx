// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dayBounds } from '@exyconn/tracker-core';
import DayDetailPanel from '../../../../src/renderer/components/DayDetailPanel';
import { button, clickElement, render, stubTracker, unmountAll } from '../../test-utils';
import { DAY_DETAIL, pageText } from './fixtures';

afterEach(unmountAll);

const DATE = new Date(2026, 8, 14);

describe('DayDetailPanel', () => {
  it('heads the day and shows why it could not be read', async () => {
    await render(
      <DayDetailPanel date={DATE} detail={null} loading={false} error="Offline" timezone="UTC" />,
    );
    expect(document.querySelector('h2')?.textContent).toBe('Mon 14 Sep');
    expect(document.querySelector('.MuiAlert-colorError')?.textContent).toBe('Offline');
  });

  it('holds skeletons for the totals and tiles while the day loads', async () => {
    await render(<DayDetailPanel date={DATE} detail={null} loading error={null} timezone="UTC" />);
    expect(document.querySelectorAll('.MuiSkeleton-root')).toHaveLength(5);
    expect(pageText()).not.toContain('Total worked');
  });

  it('shows the totals, the counts and the screenshots, and opens the gallery on the day', async () => {
    const openScreenshots = vi.fn(() => Promise.resolve());
    stubTracker({ openScreenshots });
    await render(
      <DayDetailPanel
        date={DATE}
        detail={DAY_DETAIL}
        loading={false}
        error={null}
        timezone="UTC"
      />,
    );
    expect(pageText()).toContain('Total worked');
    expect(pageText()).toContain('1h 0m');
    expect(pageText()).toContain('86%');
    expect(pageText()).toContain('1,200 keys · 800 clicks · 2 sessions');
    expect(pageText()).toContain('Screenshots (1)');

    await clickElement(button('Open gallery'));
    await clickElement(button('Open my screenshots'));
    expect(openScreenshots).toHaveBeenCalledTimes(2);
    expect(openScreenshots).toHaveBeenCalledWith(dayBounds(DATE, 'UTC'));
  });

  it('offers no gallery on a day without screenshots', async () => {
    await render(
      <DayDetailPanel
        date={DATE}
        detail={{ ...DAY_DETAIL, screenshots: [] }}
        loading={false}
        error={null}
        timezone="UTC"
      />,
    );
    expect(pageText()).toContain('Screenshots (0)');
    expect(pageText()).toContain('No screenshots on this day.');
    expect(() => button('Open gallery')).toThrow();
  });
});
