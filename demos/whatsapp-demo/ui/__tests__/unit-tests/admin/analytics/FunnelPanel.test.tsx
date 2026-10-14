import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FunnelPanel } from '../../../../src/admin/analytics/FunnelPanel';
import type { FlowRow } from '../../../../src/admin/analytics/analytics.data';
import { renderWithProviders } from '../../test-utils';

const funnel = vi.hoisted(() => ({
  result: { data: undefined as unknown, loading: false, error: undefined as unknown },
  variables: null as unknown,
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWhatsappDemoFunnelQuery: (options: { variables: unknown }) => {
    funnel.variables = options.variables;
    return { ...funnel.result, refetch: funnel.refetch };
  },
}));
vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const { ChartStub } = await import('./chart-stub');
  return { ...(await importOriginal<object>()), BarChart: ChartStub };
});

const FLOW: FlowRow = {
  id: 'clinic:book-visit',
  demoKey: 'clinic',
  workflow: 'book-visit',
  industry: 'Healthcare',
  name: 'Book a visit',
  started: 10,
  completed: 4,
  abandoned: 6,
  completionPct: 40,
};
const RANGE = { from: '2026-09-01T00:00:00.000Z', to: '2026-09-30T23:59:59.999Z' };
const steps = (count: number) =>
  Array.from({ length: count }, (_unused, index) => ({
    node: `n-${index + 1}`,
    label: `Step ${index + 1}`,
    sessions: 10 - index,
  }));

beforeEach(() => {
  funnel.result = { data: undefined, loading: false, error: undefined };
  funnel.refetch.mockReset().mockResolvedValue({});
});

describe('FunnelPanel', () => {
  it('asks for the selected workflow over the analysed period', () => {
    funnel.result = { data: undefined, loading: true, error: undefined };
    renderWithProviders(<FunnelPanel flow={FLOW} range={RANGE} />);
    expect(funnel.variables).toEqual({ demoKey: 'clinic', workflow: 'book-visit', ...RANGE });
    expect(screen.getByRole('heading', { name: 'Funnel: Book a visit' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'chart' })).not.toBeInTheDocument();
  });

  it('charts the sessions reaching each step with the drop-off', () => {
    funnel.result = {
      data: {
        whatsappDemoFunnel: [
          { node: 'a', label: 'Welcome', sessions: 10 },
          { node: 'b', label: 'Pick a slot', sessions: 4 },
        ],
      },
      loading: false,
      error: undefined,
    };
    renderWithProviders(<FunnelPanel flow={FLOW} range={RANGE} />);
    expect(screen.getByRole('heading', { name: 'Funnel: Book a visit' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Healthcare — sessions reaching each step, with the drop-off from the step before',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Sessions reaching the step — 1. Welcome: 10, 2. Pick a slot (60% drop-off): 4',
      ),
    ).toBeInTheDocument();
    // A short flow keeps the minimum height.
    expect(screen.getByRole('list', { name: 'chart' })).toHaveAttribute('data-height', '160');
  });

  it('grows the chart with the number of steps', () => {
    funnel.result = { data: { whatsappDemoFunnel: steps(6) }, loading: false, error: undefined };
    renderWithProviders(<FunnelPanel flow={FLOW} range={RANGE} />);
    expect(screen.getByRole('list', { name: 'chart' })).toHaveAttribute('data-height', '240');
  });

  it('keeps the last chart on screen while a refetch is in flight', () => {
    funnel.result = { data: { whatsappDemoFunnel: steps(2) }, loading: true, error: undefined };
    renderWithProviders(<FunnelPanel flow={FLOW} range={RANGE} />);
    expect(screen.getByRole('list', { name: 'chart' })).toBeInTheDocument();
  });

  it('says when nobody reached a step', () => {
    funnel.result = { data: { whatsappDemoFunnel: [] }, loading: false, error: undefined };
    renderWithProviders(<FunnelPanel flow={FLOW} range={RANGE} />);
    expect(
      screen.getByText('Nobody reached a step of this workflow in this period.'),
    ).toBeInTheDocument();
  });

  it('reports a failed funnel and retries it', async () => {
    const user = userEvent.setup();
    funnel.result = { data: undefined, loading: false, error: new Error('Timed out') };
    renderWithProviders(<FunnelPanel flow={FLOW} range={RANGE} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the funnel. Timed out');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(funnel.refetch).toHaveBeenCalledTimes(1);
  });
});
