import type { ChartData as ChartJsData, ChartOptions } from 'chart.js';

/** What the chart components hand to react-chartjs-2 — captured instead of drawn (jsdom has no canvas). */
export interface CapturedChart {
  data: ChartJsData<'bar' | 'line'>;
  options: ChartOptions<'bar' | 'line'>;
  'aria-labelledby'?: string;
}

/** A stand-in for a react-chartjs-2 chart: records its props and renders a labelled canvas. */
export function fakeChart(testId: string, calls: CapturedChart[]) {
  return function FakeChart(props: Readonly<CapturedChart>) {
    calls.push(props);
    return <canvas data-testid={testId} aria-labelledby={props['aria-labelledby']} />;
  };
}

/** The props of the most recent render. */
export function lastCall(calls: readonly CapturedChart[]): CapturedChart {
  const call = calls.at(-1);
  if (!call) {
    throw new Error('The chart was never rendered');
  }
  return call;
}
