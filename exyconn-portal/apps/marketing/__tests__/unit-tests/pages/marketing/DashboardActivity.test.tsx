import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { DEFAULT_FORMAT_SETTINGS, formatDate, formatDateTime } from '@exyconn/i18n';
import type { ChartData } from '@exyconn/shell/components/ui';
import { CampaignSendState, type MarketingDashboardQuery } from '@exyconn/shell/graphql/generated';
import { DashboardActivity } from '../../../../src/pages/marketing/DashboardActivity';
import { renderWithProviders } from '../../test-utils';

type Dashboard = MarketingDashboardQuery['marketingDashboard'];

interface ChartProps {
  title?: string;
  subtitle?: string;
  emptyText?: string;
  labelHeading?: string;
  data: ChartData;
  formatValue: (value: number) => string;
  children?: ReactNode;
}

/** Charts need a canvas jsdom lacks: the stand-ins list each day's value through the formatter. */
vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
  ChartCard: ({
    title,
    subtitle,
    emptyText,
    labelHeading,
    data,
    formatValue,
    children,
  }: Readonly<ChartProps>) => (
    <section aria-label={title}>
      <p>{subtitle}</p>
      <p>{`${labelHeading} / ${emptyText}`}</p>
      <ul aria-label="days">
        {data.labels.map((label, index) => (
          <li key={label}>{`${label}: ${formatValue(data.series[0].values[index])}`}</li>
        ))}
      </ul>
      {children}
    </section>
  ),
  TrendChart: ({ data, formatValue }: Readonly<ChartProps>) => (
    <p>{`${data.series[0].label} trend, peak ${formatValue(Math.max(...data.series[0].values))}`}</p>
  ),
}));

const AT = '2026-10-18T07:00:00.000Z';

function dashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    campaigns: 0,
    drafts: 0,
    scheduled: 0,
    sending: 0,
    sentLast30: 0,
    failedLast30: 0,
    clickedLast30: 0,
    clickRateLast30: 0,
    unsubscribesLast30: 0,
    suppressed: 0,
    audiences: 0,
    upcoming: [],
    recent: [],
    daily: [],
    ...overrides,
  };
}

const listUnder = (heading: string) => screen.getByText(heading).parentElement as HTMLElement;

describe('DashboardActivity', () => {
  it('charts the copies sent per day, labelled in the viewer’s date format', () => {
    renderWithProviders(
      <DashboardActivity
        dashboard={dashboard({
          daily: [
            { day: '2026-10-17', sent: 1200 },
            { day: '2026-10-18', sent: 40 },
          ],
        })}
      />,
    );
    const chart = screen.getByRole('region', { name: 'Emails sent — last 30 days' });

    expect(within(chart).getByText('Copies the mail server accepted, per day')).toBeVisible();
    expect(within(chart).getByText('Day / Nothing was sent in the last 30 days.')).toBeVisible();
    expect(
      within(chart)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      `${formatDate('2026-10-17', DEFAULT_FORMAT_SETTINGS)}: 1,200`,
      `${formatDate('2026-10-18', DEFAULT_FORMAT_SETTINGS)}: 40`,
    ]);
    expect(within(chart).getByText('Copies sent trend, peak 1,200')).toBeVisible();
  });

  it('says so when nothing is scheduled or has been sent', () => {
    renderWithProviders(<DashboardActivity dashboard={dashboard()} />);

    expect(screen.getByText('Nothing is scheduled.')).toBeInTheDocument();
    expect(screen.getByText('No campaign has been sent yet.')).toBeInTheDocument();
  });

  it('links each upcoming campaign to its studio, with its time and no state', () => {
    renderWithProviders(
      <DashboardActivity
        dashboard={dashboard({ upcoming: [{ id: 'c-1', name: 'Diwali offer', at: AT }] })}
      />,
    );
    const upcoming = listUnder('Scheduled next');

    expect(within(upcoming).getByRole('link', { name: 'Diwali offer' })).toHaveAttribute(
      'href',
      '/marketing/campaigns/c-1',
    );
    expect(
      within(upcoming).getByText(formatDateTime(AT, DEFAULT_FORMAT_SETTINGS)),
    ).toBeInTheDocument();
    expect(within(upcoming).queryByText('SCHEDULED')).not.toBeInTheDocument();
  });

  it('shows how each recent send went and how many it reached', () => {
    renderWithProviders(
      <DashboardActivity
        dashboard={dashboard({
          recent: [
            {
              id: 'c-2',
              name: 'Newsletter',
              at: AT,
              recipients: 2500,
              sendState: CampaignSendState.Sent,
            },
            { id: 'c-3', name: 'Launch', at: null, recipients: null, sendState: null },
            { id: 'c-4', name: 'Webinar', recipients: 0 },
          ],
        })}
      />,
    );
    const recent = listUnder('Sent recently');
    const [newsletter, launch, webinar] = within(recent).getAllByRole('listitem');

    expect(within(newsletter).getByText('SENT')).toBeInTheDocument();
    expect(
      within(newsletter).getByText(
        `${formatDateTime(AT, DEFAULT_FORMAT_SETTINGS)} · 2,500 recipient(s)`,
      ),
    ).toBeInTheDocument();
    expect(launch).toHaveTextContent(/^Launch$/);
    expect(within(webinar).getByText('0 recipient(s)')).toBeInTheDocument();
    expect(within(recent).getByRole('link', { name: 'Webinar' })).toHaveAttribute(
      'href',
      '/marketing/campaigns/c-4',
    );
  });
});
