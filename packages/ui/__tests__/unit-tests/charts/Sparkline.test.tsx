import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sparkline } from '../../../src/charts/Sparkline';
import { CHART_SERIES_DARK, CHART_SERIES_LIGHT, wash } from '../../../src/charts/palette';
import { renderWithProviders } from '../test-utils';
import { lastCall, type CapturedChart } from './chart-mock';

const calls = vi.hoisted(() => [] as CapturedChart[]);
vi.mock('react-chartjs-2', async () => {
  const { fakeChart } = await import('./chart-mock');
  return { Line: fakeChart('line', calls) };
});

beforeEach(() => {
  calls.length = 0;
});

describe('Sparkline', () => {
  it.each([[[]], [[5]]])('draws nothing for fewer than two points (%j)', (values) => {
    const { container } = render(<Sparkline values={values} />);
    expect(container).toBeEmptyDOMElement();
    expect(calls).toHaveLength(0);
  });

  it('draws a washed line in the first slot, hidden from assistive technology', () => {
    const { container } = render(<Sparkline values={[1, 4, 2]} />);
    const box = container.firstElementChild as HTMLElement;
    expect(box).toHaveAttribute('aria-hidden', 'true');
    expect(box).toHaveStyle({ height: '32px', width: '100%' });
    const { data, options } = lastCall(calls);
    expect(data.labels).toEqual(['0', '1', '2']);
    expect(data.datasets[0]).toMatchObject({
      data: [1, 4, 2],
      borderColor: CHART_SERIES_LIGHT[0],
      backgroundColor: wash(CHART_SERIES_LIGHT[0], 0.2),
      fill: true,
      pointRadius: 0,
    });
    // Read at a glance or not at all: no events, tooltip, legend or axes.
    expect(options).toMatchObject({
      events: [],
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    });
    expect(screen.getByTestId('line')).toBeInTheDocument();
  });

  it('takes a colour and height, and leaves the area bare when asked', () => {
    const { container } = render(
      <Sparkline values={[3, 1]} color="#ff0000" height={48} area={false} />,
    );
    expect(container.firstElementChild).toHaveStyle({ height: '48px' });
    expect(lastCall(calls).data.datasets[0]).toMatchObject({
      borderColor: '#ff0000',
      backgroundColor: 'transparent',
      fill: false,
    });
  });

  it('uses the dark palette under a dark theme', () => {
    renderWithProviders(<Sparkline values={[1, 2]} />, { mode: 'dark' });
    expect(lastCall(calls).data.datasets[0].borderColor).toBe(CHART_SERIES_DARK[0]);
  });
});
