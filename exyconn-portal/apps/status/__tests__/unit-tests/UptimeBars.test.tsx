import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { UptimeBars } from '../../src/pages/status/UptimeBars';

const day = (date: string, checks: number, failures: number) => ({
  date,
  uptimePercent: checks === 0 ? 0 : ((checks - failures) / checks) * 100,
  avgResponseMs: 180,
  checks,
  failures,
});

const days = [day('2026-09-01', 4, 0), day('2026-09-02', 4, 1), day('2026-09-03', 0, 0)];

function renderBars() {
  render(
    <ThemeProvider theme={theme}>
      <UptimeBars days={days} />
    </ThemeProvider>,
  );
  return screen.getAllByRole('img');
}

describe('UptimeBars keyboard access', () => {
  it('names every bar in words and gives the row a single tab stop on the newest day', () => {
    const bars = renderBars();
    expect(screen.getByRole('group', { name: 'Daily uptime' })).toBeInTheDocument();
    expect(bars.map((bar) => bar.getAttribute('aria-label'))).toEqual([
      expect.stringContaining('100% uptime'),
      expect.stringContaining('75% uptime'),
      expect.stringContaining('no data'),
    ]);
    expect(bars.map((bar) => bar.tabIndex)).toEqual([-1, -1, 0]);
  });

  it('moves focus along the days with the arrow keys, Home and End', () => {
    const bars = renderBars();
    bars[2].focus();
    fireEvent.keyDown(bars[2], { key: 'ArrowLeft' });
    expect(bars[1]).toHaveFocus();
    fireEvent.keyDown(bars[1], { key: 'Home' });
    expect(bars[0]).toHaveFocus();
    fireEvent.keyDown(bars[0], { key: 'ArrowLeft' });
    expect(bars[0]).toHaveFocus();
    fireEvent.keyDown(bars[0], { key: 'End' });
    expect(bars[2]).toHaveFocus();
    expect(bars.map((bar) => bar.tabIndex)).toEqual([-1, -1, 0]);
  });
});
