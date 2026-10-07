import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsTab } from '../../../../src/admin/analytics';
import type { FlowRow } from '../../../../src/admin/analytics/analytics.data';
import type { DateRange } from '../../../../src/admin/shared/useDateRange';
import { renderWithProviders } from '../../test-utils';
import { demoRow, demoStats } from '../admin.fixtures';

interface FilterProps {
  preset: number | null;
  onChange: (next: DateRange) => void;
}

const api = vi.hoisted(() => ({
  stats: { data: undefined as unknown, loading: false, error: undefined as unknown },
  variables: [] as unknown[],
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWhatsappDemoStatsQuery: (options: { variables: unknown }) => {
    api.variables.push(options.variables);
    return { ...api.stats, refetch: api.refetch };
  },
  useWhatsappDemosQuery: () => ({
    data: { whatsappDemos: [demoRow({ key: 'salon', industry: 'Beauty' })] },
  }),
}));
vi.mock('../../../../src/admin/shared/DateRangeFilter', () => ({
  DateRangeFilter: ({ preset, onChange }: Readonly<FilterProps>) => (
    <button
      type="button"
      onClick={() => onChange({ from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) })}
    >
      {`Period preset ${preset ?? 'none'}`}
    </button>
  ),
}));
vi.mock('../../../../src/admin/analytics/AnalyticsCharts', () => ({
  AnalyticsCharts: () => <p>Charts</p>,
}));
vi.mock('../../../../src/admin/analytics/FunnelPanel', () => ({
  FunnelPanel: ({ flow, range }: Readonly<{ flow: FlowRow; range: { from: string } }>) => (
    <p>{`Funnel for ${flow.id} (${flow.industry}) from ${range.from}`}</p>
  ),
}));

const lastVariables = () => api.variables[api.variables.length - 1];

beforeEach(() => {
  api.stats = { data: undefined, loading: false, error: undefined };
  api.variables = [];
  api.refetch.mockReset().mockResolvedValue({});
});

describe('AnalyticsTab', () => {
  it('holds placeholders while the first answer is on its way', () => {
    api.stats = { data: undefined, loading: true, error: undefined };
    const { container } = renderWithProviders(<AnalyticsTab />, { route: '/admin/analytics' });
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.queryByText('Charts')).not.toBeInTheDocument();
    expect(document.title).toContain('WhatsApp demo analytics');
  });

  it('asks for the period in the URL and follows a new one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnalyticsTab />, {
      route: '/admin/analytics?from=2026-09-01&to=2026-09-30',
    });
    expect(lastVariables()).toEqual({
      from: new Date(2026, 8, 1).toISOString(),
      to: new Date(2026, 8, 30, 23, 59, 59, 999).toISOString(),
    });
    expect(screen.getByRole('button', { name: 'Period preset none' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Period preset none' }));
    expect(lastVariables()).toEqual({
      from: new Date(2026, 0, 1).toISOString(),
      to: new Date(2026, 0, 31, 23, 59, 59, 999).toISOString(),
    });
  });

  it('reports a failed load without headline numbers, and retries it', async () => {
    const user = userEvent.setup();
    api.stats = { data: undefined, loading: false, error: new Error('Server down') };
    renderWithProviders(<AnalyticsTab />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the analytics. Server down',
    );
    expect(screen.queryByText('Unique users')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(api.refetch).toHaveBeenCalledTimes(1);
  });

  it('says how to get data for a period without sessions', () => {
    api.stats = {
      data: { whatsappDemoStats: demoStats({ sessions: 0 }) },
      loading: false,
      error: undefined,
    };
    renderWithProviders(<AnalyticsTab />);
    expect(screen.getByText('No demo sessions in this period')).toBeInTheDocument();
    expect(screen.getByText(/Pick a longer period/)).toBeInTheDocument();
    expect(screen.queryByText('Charts')).not.toBeInTheDocument();
  });

  it('shows the numbers, the charts and a funnel for the workflow picked', async () => {
    const user = userEvent.setup();
    api.stats = { data: { whatsappDemoStats: demoStats() }, loading: false, error: undefined };
    renderWithProviders(<AnalyticsTab />, {
      route: '/admin/analytics?from=2026-09-01&to=2026-09-30',
    });
    expect(screen.getByText('Charts')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.queryByText(/Funnel for/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('cell', { name: 'Haircut' }));
    expect(
      screen.getByText(
        `Funnel for salon:haircut (Beauty) from ${new Date(2026, 8, 1).toISOString()}`,
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('cell', { name: 'Book a visit' }));
    expect(screen.getByText(/Funnel for clinic:book-visit \(clinic\)/)).toBeInTheDocument();
  });
});
