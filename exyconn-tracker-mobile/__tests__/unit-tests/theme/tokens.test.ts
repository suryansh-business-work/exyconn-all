import { describe, expect, it } from 'vitest';
import { TRACKER_CARD_RADIUS as UI_CARD_RADIUS } from '@exyconn/ui/src/tokens/border.token';
import { trackerActivity as uiActivity } from '@exyconn/ui/src/tokens/tracker.token';
import {
  TRACKER_CARD_RADIUS,
  TRACKER_RADIUS,
  borderWidth,
  radius,
  trackerActivity,
  trackerProgressGradient,
  trackerSelected,
  trackerTabBar,
} from '../../../src/theme/tokens';
import { FALLBACK_BRAND, ON_DARK, ON_LIGHT, SCRIM } from '../../../src/theme/palette';

describe('theme tokens', () => {
  it('reads shape and tracker colour roles straight from the design system', () => {
    expect(TRACKER_CARD_RADIUS).toBe(UI_CARD_RADIUS);
    expect(trackerActivity).toBe(uiActivity);
    for (const token of [TRACKER_RADIUS, borderWidth, radius, trackerProgressGradient]) {
      expect(token).toBeDefined();
    }
    expect(trackerSelected).toBeDefined();
    expect(trackerTabBar).toBeDefined();
  });

  it('keeps the brand fallback and button inks as hex colours', () => {
    for (const colour of [FALLBACK_BRAND.primary, FALLBACK_BRAND.text, ON_DARK, ON_LIGHT]) {
      expect(colour).toMatch(/^#[\da-f]{6}$/i);
    }
    expect(SCRIM).toMatch(/^#[\da-f]{6}80$/i);
  });
});
