import { describe, expect, it } from 'vitest';
import { WIDGET_PLATFORMS } from '../../../src/widget';

describe('WIDGET_PLATFORMS', () => {
  it('names each platform once, ending with plain HTML for any other site', () => {
    expect(new Set(WIDGET_PLATFORMS).size).toBe(WIDGET_PLATFORMS.length);
    expect(WIDGET_PLATFORMS).toContain('Shopify');
    expect(WIDGET_PLATFORMS.at(-1)).toBe('Plain HTML');
  });
});
