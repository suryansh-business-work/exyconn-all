import { describe, expect, it } from 'vitest';
import { INTER_FILES, fonts } from '../../../src/theme/fonts';

type FaceMap = Record<string, { normal?: string } | undefined>;

function faceOf(font: { face?: unknown }): FaceMap {
  return (font.face ?? {}) as FaceMap;
}

describe('fonts', () => {
  it('loads one Inter file per weight the app draws', () => {
    expect(Object.keys(INTER_FILES)).toEqual([
      'Inter_400Regular',
      'Inter_500Medium',
      'Inter_600SemiBold',
      'Inter_700Bold',
    ]);
  });

  it('maps every weight to a file Android can draw, never a synthesised one', () => {
    expect(faceOf(fonts.body)['300']).toEqual({ normal: 'Inter_400Regular' });
    expect(faceOf(fonts.body)['500']).toEqual({ normal: 'Inter_500Medium' });
    expect(faceOf(fonts.body)['600']).toEqual({ normal: 'Inter_600SemiBold' });
    expect(faceOf(fonts.heading)['900']).toEqual({ normal: 'Inter_700Bold' });
    expect(fonts.heading.family).toBe('Inter_400Regular');
  });

  it('sets headings at 120% line height', () => {
    const lineHeights = fonts.heading.lineHeight as Record<string, number>;
    const sizes = Object.entries(fonts.heading.size as Record<string, number>);
    expect(sizes.length).toBeGreaterThan(0);
    for (const [step, size] of sizes) {
      expect(lineHeights[step]).toBe(Math.round(size * 1.2));
    }
  });
});
