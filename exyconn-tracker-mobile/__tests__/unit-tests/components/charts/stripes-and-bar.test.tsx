import { screen } from '@testing-library/react';
import type { ChartBar } from '@exyconn/tracker-core';
import { describe, expect, it } from 'vitest';
import { GradientBar } from '../../../../src/components/charts/GradientBar';
import { StripesChart } from '../../../../src/components/charts/StripesChart';
import { trackerActivity } from '../../../../src/theme/tokens';
import { useThemeColor } from '../../../../src/theme/useThemeColor';
import { renderHookWithProviders, renderWithProviders } from '../../test-utils';
import { getByA11yLabel } from '../state';

const LABELS = { start: '9:00 AM', middle: '1:00 PM', end: '5:00 PM' };

const BARS: ChartBar[] = [
  { key: 'busy', offset: 0, width: 0.5, value: 0.8, level: 'high' },
  { key: 'empty', offset: 0.5, width: 0.5, value: 0, level: null },
];

function rects(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('rect')];
}

describe('StripesChart', () => {
  it('draws one stripe per bar, as tall as its value and placed at its offset', () => {
    const { container } = renderWithProviders(
      <StripesChart bars={BARS} labels={LABELS} summary="Two intervals" />,
    );
    const [busy, empty] = rects(container);
    expect(rects(container)).toHaveLength(2);
    expect(busy).toHaveAttribute('x', '75');
    expect(busy).toHaveAttribute('width', '350');
    expect(busy).toHaveAttribute('height', '112');
    expect(busy).toHaveAttribute('y', '28');
    expect(empty).toHaveAttribute('x', '575');
  });

  it('colours a stripe by its activity level, and an empty slot in the hairline', () => {
    const { result } = renderHookWithProviders(() => useThemeColor('hairline'));
    const { container } = renderWithProviders(
      <StripesChart bars={BARS} labels={LABELS} summary="Two intervals" />,
    );
    const [busy, empty] = rects(container);
    expect(busy).toHaveAttribute('fill', trackerActivity.light.high);
    expect(empty).toHaveAttribute('fill', result.current);
  });

  it('uses the dark palette’s hues on the dark theme', () => {
    const { container } = renderWithProviders(
      <StripesChart bars={BARS} labels={LABELS} summary="Two intervals" />,
      { themeMode: 'dark' },
    );
    expect(rects(container)[0]).toHaveAttribute('fill', trackerActivity.dark.high);
  });

  it('keeps a sliver for an empty slot and a minimum width for a thin one', () => {
    const thin: ChartBar[] = [{ key: 'thin', offset: 0, width: 0.001, value: 0, level: 'low' }];
    const { container } = renderWithProviders(
      <StripesChart bars={thin} labels={LABELS} summary="One interval" height={100} />,
    );
    const [bar] = rects(container);
    expect(bar).toHaveAttribute('height', '3');
    expect(bar).toHaveAttribute('y', '97');
    expect(bar).toHaveAttribute('width', '2');
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 1000 100');
  });

  it('is read out as its summary, with the axis labels under it', () => {
    renderWithProviders(<StripesChart bars={BARS} labels={LABELS} summary="Two intervals" />);
    expect(getByA11yLabel('Two intervals')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('1:00 PM')).toBeInTheDocument();
    expect(screen.getByText('5:00 PM')).toBeInTheDocument();
  });

  it('draws nothing for no bars', () => {
    const { container } = renderWithProviders(
      <StripesChart bars={[]} labels={LABELS} summary="Nothing" />,
    );
    expect(rects(container)).toHaveLength(0);
  });
});

describe('GradientBar', () => {
  function renderBar(percent: number) {
    return renderWithProviders(
      <GradientBar
        percent={percent}
        label="Worked"
        trailing="of 8h 0m"
        accessibilityLabel="4h 0m of 8h 0m worked today"
      />,
    );
  }

  it('stretches the gradient to the whole track so the fill shows only its share', () => {
    const { container } = renderBar(50);
    expect(container.querySelector('svg')).toHaveAttribute('width', '200%');
    expect(container.querySelectorAll('stop')).toHaveLength(3);
  });

  it('writes the label inside a fill wide enough to hold it', () => {
    renderBar(50);
    expect(screen.getByText('Worked')).toBeInTheDocument();
    expect(screen.getByText('of 8h 0m')).toBeInTheDocument();
  });

  it('leaves the label out of a fill too narrow for it', () => {
    renderBar(20);
    expect(screen.queryByText('Worked')).toBeNull();
    expect(screen.getByText('of 8h 0m')).toBeInTheDocument();
  });

  it('keeps the trailing text when the fill runs under it', () => {
    renderBar(90);
    expect(screen.getByText('Worked')).toBeInTheDocument();
    expect(screen.getByText('of 8h 0m')).toBeInTheDocument();
  });

  it('clamps an overfull day to a full track', () => {
    const { container } = renderBar(140);
    expect(container.querySelector('svg')).toHaveAttribute('width', '100%');
  });

  it('draws an empty day with a full-width gradient and no label', () => {
    const { container } = renderBar(-10);
    expect(container.querySelector('svg')).toHaveAttribute('width', '100%');
    expect(screen.queryByText('Worked')).toBeNull();
  });

  it('is announced as a progress bar with its spoken label', () => {
    renderBar(50);
    const bar = getByA11yLabel('4h 0m of 8h 0m worked today');
    expect(bar).toHaveAttribute('accessibilityrole', 'progressbar');
  });
});
