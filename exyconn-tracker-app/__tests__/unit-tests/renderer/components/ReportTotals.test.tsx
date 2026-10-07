// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import ReportTotals from '../../../../src/renderer/components/ReportTotals';
import { render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

describe('ReportTotals', () => {
  it('heads the month with total worked, total idle and average activity', async () => {
    await render(
      <ReportTotals totals={{ activeMs: 90_000_000, idleMs: 5_400_000, activityPercent: 94 }} />,
    );
    expect(pageText()).toBe('Total worked25h 0mTotal idle1h 30mAvg activity94%');
  });
});
