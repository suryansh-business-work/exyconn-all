import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, titleOf, type Section } from '../../../src/navigation/sections';

describe('NAV_ITEMS', () => {
  it('lists the desktop tracker’s five sections, in tab-bar order', () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual([
      'dashboard',
      'report',
      'messages',
      'off-computer',
      'settings',
    ]);
  });

  it('gives every tab a short pill label, a caption and an icon', () => {
    for (const item of NAV_ITEMS) {
      expect(item.short.length).toBeGreaterThan(0);
      expect(item.short.length).toBeLessThanOrEqual(item.label.length);
      expect(item.caption.length).toBeGreaterThan(0);
      expect(item.icon.length).toBeGreaterThan(0);
    }
  });
});

describe('titleOf', () => {
  it('reads each section’s page title', () => {
    expect(titleOf('dashboard')).toBe('Dashboard');
    expect(titleOf('report')).toBe('My Report');
    expect(titleOf('off-computer')).toBe('Off-computer time');
  });

  it('reads an empty title for a section that is not in the tab bar', () => {
    expect(titleOf('screenshots' as Section)).toBe('');
  });
});
