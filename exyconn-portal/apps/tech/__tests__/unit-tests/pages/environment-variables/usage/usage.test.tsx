import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { IntegrationProvider } from '@exyconn/shell/graphql/generated';
import { IntegrationsDashboard } from '../../../../../src/pages/environment-variables/usage/IntegrationsDashboard';
import { IntegrationUsageCard } from '../../../../../src/pages/environment-variables/usage/IntegrationUsageCard';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';

const gql = vi.hoisted(() => ({ usage: vi.fn(), fx: vi.fn(), bill: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useIntegrationUsageQuery: gql.usage,
  useFxRatesQuery: gql.fx,
  useProviderBillingQuery: gql.bill,
}));

/** Charts as plain lists: jsdom has no canvas for chart.js to draw on. */
vi.mock('@exyconn/shell/components/dashboard/PointChart', () => ({
  PointChart: ({
    title,
    points,
    formatValue,
  }: Readonly<{
    title: string;
    points: { period: string; value: number }[];
    formatValue: (v: number) => string;
  }>) => (
    <ul aria-label={title}>
      {points.map((point) => (
        <li key={point.period}>{`${point.period}: ${formatValue(point.value)}`}</li>
      ))}
    </ul>
  ),
}));
vi.mock('@exyconn/shell/components/dashboard/MetricChart', () => ({
  MetricChart: ({
    title,
    metrics,
  }: Readonly<{ title: string; metrics: { label: string; value: number }[] }>) => (
    <ul aria-label={title}>
      {metrics.map((metric) => (
        <li key={metric.label}>{`${metric.label}: ${metric.value}`}</li>
      ))}
    </ul>
  ),
}));

const day = (date: string, calls: number, costUsd = 0) => ({
  day: date,
  calls,
  failures: 0,
  costUsd,
});

const summary = (provider: IntegrationProvider, calls: number, costUsd = 0) => ({
  provider,
  calls,
  failures: calls > 0 ? 1 : 0,
  inputTokens: calls * 100,
  outputTokens: calls * 10,
  costUsd,
  days: [day('2026-10-23', calls - 1, costUsd / 2), day('2026-10-24', 1, costUsd / 2)],
  actions:
    calls > 0
      ? [{ action: 'gpt-4o-mini', calls, failures: 1, inputTokens: 100, outputTokens: 10, costUsd }]
      : [],
});

const USAGE = {
  data: {
    integrationUsage: [
      summary(IntegrationProvider.Openai, 4, 2),
      summary(IntegrationProvider.Slack, 3),
      summary(IntegrationProvider.Pexels, 0),
    ],
  },
  loading: false,
};
const FX = {
  data: {
    fxRates: {
      base: 'USD',
      date: '2026-10-23',
      rates: [
        { currency: 'INR', rate: 80 },
        { currency: 'USD', rate: 1 },
      ],
    },
  },
};
const BILL = {
  data: {
    providerBilling: {
      provider: 'OPENAI',
      totalUsd: 3,
      days: [{ day: '2026-10-24', amountUsd: 3 }],
    },
  },
  loading: false,
};

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderAt = (ui: React.ReactElement, route = '/tech/environment-variables/dashboard') =>
  renderWithProviders(
    <Routes>
      <Route
        path="*"
        element={
          <>
            {ui}
            <Url />
          </>
        }
      />
    </Routes>,
    { route },
  );

beforeEach(() => {
  gql.usage.mockReset().mockReturnValue(USAGE);
  gql.fx.mockReset().mockReturnValue(FX);
  gql.bill.mockReset().mockReturnValue(BILL);
});

describe('IntegrationsDashboard', () => {
  it('adds up every integration over 30 days in US dollars, with the real bill', () => {
    renderAt(<IntegrationsDashboard />);
    expect(gql.usage).toHaveBeenCalledWith({
      variables: { days: 30 },
      fetchPolicy: 'cache-and-network',
    });
    expect(gql.bill).toHaveBeenCalledWith({
      variables: { provider: 'OPENAI', days: 30 },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('heading', { name: 'Integrations dashboard' })).toBeInTheDocument();
    expect(
      screen.getByText('Costs are recorded in USD and converted at the rate of 2026-10-23.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Calls by integration' })).toHaveTextContent(
      'OpenAI: 4',
    );
    expect(screen.getByRole('list', { name: 'Estimated cost per day' })).toHaveTextContent(
      '2026-10-24: $1.00',
    );
    const openai = screen.getByText('OpenAI', { selector: 'td' }).closest('tr') as HTMLElement;
    expect(within(openai).getByText('$2.00')).toBeInTheDocument();
    expect(screen.getByText(/Billed in all over the period: \$3\.00/)).toBeInTheDocument();
  });

  it('converts to the currency picked and keeps the choice in the address', async () => {
    renderAt(
      <IntegrationsDashboard />,
      '/tech/environment-variables/dashboard?currency=INR&days=7',
    );
    expect(gql.usage).toHaveBeenCalledWith(expect.objectContaining({ variables: { days: 7 } }));
    expect(screen.getByText(/Billed in all over the period: ₹240\.00/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('combobox', { name: 'Currency' }));
    await userEvent.click(screen.getByRole('option', { name: 'USD' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('currency=USD');
    await userEvent.click(screen.getByRole('combobox', { name: 'Period' }));
    await userEvent.click(screen.getByRole('option', { name: 'Last 90 days' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('days=90');
  });

  it('falls back to US dollars for a currency without a rate, and opens an integration', async () => {
    gql.fx.mockReturnValue({ data: undefined });
    renderAt(
      <IntegrationsDashboard />,
      '/tech/environment-variables/dashboard?currency=EUR&days=12',
    );
    expect(gql.usage).toHaveBeenCalledWith(expect.objectContaining({ variables: { days: 30 } }));
    expect(
      screen.getByText('Costs are shown in USD until the first exchange rates arrive.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByText('Slack', { selector: 'td' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('/tech/environment-variables/slack');
  });

  it('waits while the usage loads, and says why it could not be read', () => {
    gql.usage.mockReturnValue({ data: undefined, loading: true });
    const { container, unmount } = renderAt(<IntegrationsDashboard />);
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    unmount();
    gql.usage.mockReturnValue({ data: undefined, loading: false, error: new Error('Forbidden') });
    renderAt(<IntegrationsDashboard />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    unmount();
  });

  it('shows nothing while nothing has loaded and nothing is loading', () => {
    gql.usage.mockReturnValue({ data: undefined, loading: false });
    renderAt(<IntegrationsDashboard />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('IntegrationUsageCard', () => {
  it('shows OpenAI calls, tokens, cost by model and the bill', () => {
    renderAt(<IntegrationUsageCard provider={IntegrationProvider.Openai} />);
    expect(screen.getByRole('heading', { name: 'Usage and billing' })).toBeInTheDocument();
    expect(screen.getByText('Tokens')).toBeInTheDocument();
    expect(screen.getByText('Estimated cost')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o-mini').closest('tr')).toHaveTextContent('$2.00');
    expect(gql.bill).toHaveBeenCalled();
  });

  it('shows calls only for an integration that does not bill by token, with no bill', () => {
    renderAt(<IntegrationUsageCard provider={IntegrationProvider.Pexels} />);
    expect(screen.queryByText('Tokens')).not.toBeInTheDocument();
    expect(screen.getByText('No calls in this period.')).toBeInTheDocument();
    expect(gql.bill).not.toHaveBeenCalled();
  });

  it('says why usage could not be read, and waits while it loads', () => {
    gql.usage.mockReturnValue({ data: undefined, loading: false, error: new Error('Forbidden') });
    const { unmount } = renderAt(<IntegrationUsageCard provider={IntegrationProvider.Slack} />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    unmount();
    gql.usage.mockReturnValue({ data: undefined, loading: true });
    const { container } = renderAt(<IntegrationUsageCard provider={IntegrationProvider.Slack} />);
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders nothing below the controls before the first answer', () => {
    gql.usage.mockReturnValue({ data: undefined, loading: false });
    renderAt(<IntegrationUsageCard provider={IntegrationProvider.Slack} />);
    expect(screen.queryByText('Calls')).not.toBeInTheDocument();
  });
});

describe('ProviderBillingCard', () => {
  it('says where to add a billing key, waits while it loads, and reports a refusal', () => {
    gql.bill.mockReturnValue({ data: { providerBilling: null }, loading: false });
    const first = renderAt(<IntegrationUsageCard provider={IntegrationProvider.Openai} />);
    expect(
      screen.getByText(
        'Add a billing key in Environment Variables > Billing keys to see what was billed.',
      ),
    ).toBeInTheDocument();
    first.unmount();
    gql.bill.mockReturnValue({ data: undefined, loading: true });
    const second = renderAt(<IntegrationUsageCard provider={IntegrationProvider.Openai} />);
    expect(second.container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
    second.unmount();
    gql.bill.mockReturnValue({ data: undefined, loading: false, error: new Error('Key revoked') });
    renderAt(<IntegrationUsageCard provider={IntegrationProvider.Openai} />);
    expect(screen.getByText('Key revoked')).toBeInTheDocument();
  });

  it('never asks for more days than the provider answers', () => {
    renderAt(
      <IntegrationUsageCard provider={IntegrationProvider.Openai} />,
      '/tech/environment-variables/openai?days=180',
    );
    expect(gql.bill).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { provider: 'OPENAI', days: 180 } }),
    );
  });
});
