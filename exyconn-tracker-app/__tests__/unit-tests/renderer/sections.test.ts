import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, SECTIONS_TABS, type Section } from '../../../src/renderer/sections';

const SECTIONS: Section[] = ['dashboard', 'report', 'messages', 'off-computer', 'settings'];

describe('the app’s sections', () => {
  it('lists every pane once, dashboard first, in tab-bar order', () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual(SECTIONS);
  });

  it('gives each a title, a short tab label, a caption and an icon', () => {
    for (const item of NAV_ITEMS) {
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.short.length).toBeGreaterThan(0);
      expect(item.caption.length).toBeGreaterThan(0);
      expect(item.icon).toBeTruthy();
    }
  });

  it('ties the tab bar to the content panel under one id base', () => {
    expect(SECTIONS_TABS).toBe('sections');
  });
});
