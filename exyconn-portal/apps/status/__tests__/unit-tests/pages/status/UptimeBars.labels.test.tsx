import { describe, expect, it } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { UptimeBars } from '../../../../src/pages/status/UptimeBars';
import { renderWithProviders } from '../../test-utils';
import { dayPoint } from './status.fixtures';

describe('UptimeBars wording and range', () => {
  it('words a single check and a failing day, and labels the first and last day', () => {
    renderWithProviders(
      <UptimeBars days={[dayPoint('2026-09-01', 1), dayPoint('2026-09-02', 10, 5)]} />,
    );
    const bars = screen.getAllByRole('img');
    expect(bars[0]).toHaveAccessibleName('1 Sep 2026 — 100% uptime, 0 of 1 check failed');
    expect(bars[1]).toHaveAccessibleName('2 Sep 2026 — 50% uptime, 5 of 10 checks failed');
    expect(screen.getByText('1 Sep 2026')).toBeInTheDocument();
    expect(screen.getByText('2 Sep 2026')).toBeInTheDocument();
  });

  it('moves right with the arrow key, stops at the newest day and ignores other keys', () => {
    renderWithProviders(
      <UptimeBars days={[dayPoint('2026-09-01', 4), dayPoint('2026-09-02', 4, 1)]} />,
    );
    const bars = screen.getAllByRole('img');
    // The newest day holds the tab stop until another bar takes focus.
    expect(bars.map((bar) => bar.tabIndex)).toEqual([-1, 0]);
    act(() => bars[0].focus());
    expect(bars.map((bar) => bar.tabIndex)).toEqual([0, -1]);

    expect(fireEvent.keyDown(bars[0], { key: 'ArrowRight' })).toBe(false);
    expect(bars[1]).toHaveFocus();
    fireEvent.keyDown(bars[1], { key: 'ArrowRight' });
    expect(bars[1]).toHaveFocus();
    // Not a navigation key: left alone, so Tab and Enter keep their usual meaning.
    expect(fireEvent.keyDown(bars[1], { key: 'Enter' })).toBe(true);
    expect(bars[1]).toHaveFocus();
  });

  it('draws nothing, and labels no range, without any history', () => {
    renderWithProviders(<UptimeBars days={[]} />);
    expect(screen.getByRole('group', { name: 'Daily uptime' })).toBeEmptyDOMElement();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
