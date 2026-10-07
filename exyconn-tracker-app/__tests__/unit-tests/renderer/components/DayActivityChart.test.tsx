// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import DayActivityChart from '../../../../src/renderer/components/DayActivityChart';
import { render, unmountAll } from '../../test-utils';
import { DAY_DETAIL, pageText } from './fixtures';

afterEach(unmountAll);

describe('DayActivityChart', () => {
  it('holds a skeleton while the first read of the day is on its way', async () => {
    await render(<DayActivityChart title="Activity" detail={null} loading timezone="UTC" />);
    expect(document.querySelector('.MuiSkeleton-root')).not.toBeNull();
    expect(pageText()).not.toContain('Nothing has synced');
  });

  it('says so on a day nothing has reached the portal', async () => {
    await render(
      <DayActivityChart
        title="Activity"
        detail={{ ...DAY_DETAIL, intervals: [] }}
        loading={false}
        timezone="UTC"
      />,
    );
    expect(pageText()).toContain('Nothing has synced for this day yet.');
    expect(document.querySelector('svg[role="img"]')).toBeNull();
  });

  it('draws one stripe per interval, with the span on the axis and a spoken summary', async () => {
    await render(
      <DayActivityChart title="Activity" detail={DAY_DETAIL} loading={false} timezone="UTC" />,
    );
    const chart = document.querySelector('svg[role="img"]');
    expect(chart?.getAttribute('aria-label')).toBe(
      '2 intervals from 9:00 AM to 9:20 AM, 65% active overall.',
    );
    expect(chart?.querySelectorAll('rect')).toHaveLength(2);
    expect(pageText()).toContain('65%');
    expect(pageText()).toContain('9:10 AM');
  });

  it('reads the times in the employee’s zone, not this computer’s', async () => {
    await render(
      <DayActivityChart
        title="Activity"
        detail={DAY_DETAIL}
        loading={false}
        timezone="Asia/Kolkata"
      />,
    );
    expect(document.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toContain(
      'from 2:30 PM to 2:50 PM',
    );
  });
});
