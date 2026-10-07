import { describe, expect, it } from 'vitest';
import {
  nextTabIndex,
  panelId,
  panelProps,
  tabId,
  tabProps,
} from '../../../../src/renderer/a11y/tabs';

describe('tab and panel ids', () => {
  it('derives a tab id from the base and the tab value', () => {
    expect(tabId('report', 'calendar')).toBe('report-tab-calendar');
  });

  it('derives the single panel id from the base', () => {
    expect(panelId('report')).toBe('report-panel');
  });

  it('points each tab at the shared panel', () => {
    expect(tabProps('r1', 'days')).toEqual({
      id: 'r1-tab-days',
      'aria-controls': 'r1-panel',
    });
  });

  it('labels the panel by the selected tab', () => {
    expect(panelProps('r1', 'days')).toEqual({
      role: 'tabpanel',
      id: 'r1-panel',
      'aria-labelledby': 'r1-tab-days',
    });
  });

  it('keeps tabs of different bases apart', () => {
    expect(tabProps('a', 'x').id).not.toBe(tabProps('b', 'x').id);
    expect(panelId('a')).not.toBe(panelId('b'));
  });
});

describe('nextTabIndex in a left-to-right row', () => {
  it('moves forward on ArrowRight and wraps from the last tab to the first', () => {
    expect(nextTabIndex('ArrowRight', 0, 3, false)).toBe(1);
    expect(nextTabIndex('ArrowRight', 2, 3, false)).toBe(0);
  });

  it('moves back on ArrowLeft and wraps from the first tab to the last', () => {
    expect(nextTabIndex('ArrowLeft', 2, 3, false)).toBe(1);
    expect(nextTabIndex('ArrowLeft', 0, 3, false)).toBe(2);
  });

  it('jumps to the ends on Home and End', () => {
    expect(nextTabIndex('Home', 2, 4, false)).toBe(0);
    expect(nextTabIndex('End', 0, 4, false)).toBe(3);
  });

  it('ignores every other key', () => {
    expect(nextTabIndex('Enter', 1, 3, false)).toBeNull();
    expect(nextTabIndex('ArrowUp', 1, 3, false)).toBeNull();
  });
});

describe('nextTabIndex in a right-to-left row', () => {
  it('swaps the arrows: ArrowLeft goes forward', () => {
    expect(nextTabIndex('ArrowLeft', 0, 3, true)).toBe(1);
    expect(nextTabIndex('ArrowLeft', 2, 3, true)).toBe(0);
  });

  it('swaps the arrows: ArrowRight goes back', () => {
    expect(nextTabIndex('ArrowRight', 1, 3, true)).toBe(0);
    expect(nextTabIndex('ArrowRight', 0, 3, true)).toBe(2);
  });

  it('still uses Home and End for the logical ends', () => {
    expect(nextTabIndex('Home', 1, 3, true)).toBe(0);
    expect(nextTabIndex('End', 1, 3, true)).toBe(2);
  });

  it('stays on the only tab of a single-tab row', () => {
    expect(nextTabIndex('ArrowLeft', 0, 1, true)).toBe(0);
    expect(nextTabIndex('ArrowRight', 0, 1, true)).toBe(0);
  });
});
