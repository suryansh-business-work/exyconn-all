// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { ChartBar } from '@exyconn/tracker-core';
import StripesChart from '../../../../src/renderer/components/StripesChart';
import { render, unmountAll, withProviders } from '../../test-utils';

afterEach(unmountAll);

const LABELS = { start: 'Mon 8 Sep', middle: 'Thu 11 Sep', end: 'Sun 14 Sep' };

const BARS: ChartBar[] = [
  { key: 'a', offset: 0, width: 0.5, value: 0.5, level: 'high' },
  { key: 'b', offset: 0.5, width: 0.0001, value: 0, level: null },
];

function rects(): SVGRectElement[] {
  return [...document.querySelectorAll('rect')];
}

describe('StripesChart', () => {
  it('speaks its summary and labels the axis in plain text', async () => {
    await render(<StripesChart bars={BARS} labels={LABELS} summary="Two days tracked." />);
    expect(document.querySelector('svg')?.getAttribute('aria-label')).toBe('Two days tracked.');
    expect(document.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 1000 140');
    expect(document.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      'Mon 8 SepThu 11 SepSun 14 Sep',
    );
  });

  it('places each bar in its slot, as tall as its value, with a gap between neighbours', async () => {
    await render(<StripesChart bars={BARS} labels={LABELS} summary="s" height={100} />);
    const [full, empty] = rects();
    expect(full.getAttribute('x')).toBe('75');
    expect(full.getAttribute('width')).toBe('350');
    expect(full.getAttribute('height')).toBe('50');
    expect(full.getAttribute('y')).toBe('50');
    // An empty slot still draws a sliver, so it reads as a slot rather than a missing bar.
    expect(empty.getAttribute('height')).toBe('3');
    expect(empty.getAttribute('y')).toBe('97');
    expect(empty.getAttribute('width')).toBe('2');
    expect(full.getAttribute('fill')).not.toBe(empty.getAttribute('fill'));
  });

  it('colours the bars from the dark palette in dark mode', async () => {
    await render(<StripesChart bars={BARS} labels={LABELS} summary="s" />);
    const light = rects()[0].getAttribute('fill');
    unmountAll();
    await render(
      withProviders(<StripesChart bars={BARS} labels={LABELS} summary="s" />, {
        themeMode: 'dark',
      }),
    );
    expect(rects()[0].getAttribute('fill')).not.toBe(light);
  });
});
