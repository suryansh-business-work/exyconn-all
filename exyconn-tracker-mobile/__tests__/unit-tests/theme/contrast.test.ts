import { describe, expect, it } from 'vitest';
import { AA_LARGE, AA_TEXT, contrastRatio } from '@exyconn/ui/src/a11y/contrast';
import { brandColors } from '../../../src/theme/brand';
import { CHROME } from '../../../src/theme/palette';
import type { Branding } from '@exyconn/tracker-core';

/**
 * WCAG 2.2 AA on the phone: every ink the chrome lays text in, on every surface, in both
 * schemes — and the workspace's brand colour, whatever the workspace picked.
 */
describe.each(['light', 'dark'] as const)('%s scheme', (scheme) => {
  const chrome = CHROME[scheme];

  for (const ink of ['ink', 'muted', 'success', 'warning', 'error'] as const) {
    for (const surface of ['app', 'paper'] as const) {
      it(`${ink} reads on ${surface}`, () => {
        expect(contrastRatio(chrome[ink], chrome[surface])).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }

  const brands: Record<string, string> = {
    'the Exyconn default': '',
    'a pale yellow brand': '#fff176',
    'a very dark navy brand': '#0b1026',
  };

  for (const [name, primaryColor] of Object.entries(brands)) {
    it(`${name} is readable as a link, and its button label is readable on it`, () => {
      const brand = brandColors({ primaryColor } as Branding, scheme);
      expect(contrastRatio(brand.primary, chrome.paper)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(brand.onPrimary, brand.primary)).toBeGreaterThanOrEqual(AA_TEXT);
    });
  }
});

describe.each(['light', 'dark'] as const)('the edge of a control, %s scheme', (scheme) => {
  // SC 1.4.11: the boundary that identifies a text field or checkbox needs 3:1.
  for (const surface of ['app', 'paper'] as const) {
    it(`is visible on ${surface}`, () => {
      expect(contrastRatio(CHROME[scheme].control, CHROME[scheme][surface])).toBeGreaterThanOrEqual(
        AA_LARGE,
      );
    });
  }
});
