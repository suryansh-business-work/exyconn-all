import { describe, expect, it } from 'vitest';
import { axisChrome } from '../../src/charts/chart-options';
import { chartPalette } from '../../src/charts/palette';

const palette = chartPalette('light', '#ffffff', '#e4e4e7', '#67676f', '#09090b');

describe('axisChrome', () => {
  it('ticks whole numbers only when the values are counts', () => {
    expect(axisChrome(palette, String, true).value.ticks).toMatchObject({ precision: 0 });
  });

  it('leaves fractional ticks alone for measures such as money or percentages', () => {
    expect(axisChrome(palette, String).value.ticks).not.toHaveProperty('precision');
  });

  it('labels value ticks through the chart formatter', () => {
    const { callback } = axisChrome(palette, (value) => `${value}%`).value.ticks;
    expect(callback(50)).toBe('50%');
  });
});
