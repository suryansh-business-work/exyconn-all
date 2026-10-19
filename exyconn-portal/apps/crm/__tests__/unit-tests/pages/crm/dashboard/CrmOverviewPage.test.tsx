import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CrmDashboardGranularity,
  CrmInsightKind,
  CrmInsightTone,
  DealStage,
  LeadSource,
  type CrmDashboardQuery,
} from '@exyconn/shell/graphql/generated';
import { CrmOverviewPage } from '../../../../../src/pages/crm';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';
import { answered, pending } from '../../../fixtures';

const hook = vi.hoisted(() => ({
  answer: null as unknown,
  variables: null as unknown,
  skip: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmDashboardQuery: (options: { variables: unknown; skip: boolean }) => {
    hook.variables = options.variables;
    hook.skip = options.skip;
    return hook.answer;
  },
}));

// Canvas drawing is Chart.js's business; the chart's table twin carries the numbers.
vi.mock('react-chartjs-2', () => ({ Bar: () => null, Line: () => null }));

const period = (key: string) => ({ key, start: `${key}T00:00:00.000Z` });

const dashboard: CrmDashboardQuery['crmDashboard'] = {
  timezone: 'UTC',
  granularity: CrmDashboardGranularity.Day,
  kpis: {
    openDealCount: 2,
    openPipelineValue: 500,
    weightedPipelineValue: 350,
    wonCount: 2,
    wonValue: 1400,
    lostCount: 1,
    winRate: 2 / 3,
    newLeads: 7,
    newContacts: 4,
    newCompanies: 3,
    overdueTasks: 1,
    overdueReminders: 2,
    meetingsBooked: 5,
  },
  pipelineByStage: [{ stage: DealStage.Proposal, count: 1, value: 300 }],
  wonOverTime: [{ ...period('2026-10-01'), count: 2, value: 1400 }],
  leadsBySource: [{ source: LeadSource.Referral, count: 7, won: 2 }],
  activitiesOverTime: [
    { ...period('2026-10-01'), call: 1, email: 0, meeting: 0, note: 0, task: 2 },
  ],
  topOwners: [{ owner: 'Ravi', value: 1000, count: 1 }],
  insights: [
    {
      kind: CrmInsightKind.OverdueReminders,
      tone: CrmInsightTone.Warning,
      count: 2,
      label: '',
      compareLabel: '',
      ratio: 0,
      days: 0,
    },
    {
      kind: CrmInsightKind.LeadSourceConversion,
      tone: CrmInsightTone.Positive,
      count: 7,
      label: 'REFERRAL',
      compareLabel: 'WEBSITE',
      ratio: 2,
      days: 0,
    },
  ],
};

function UrlProbe() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderPage = (route = '/') =>
  renderWithProviders(
    <>
      <CrmOverviewPage />
      <UrlProbe />
    </>,
    { route },
  );

beforeEach(() => {
  hook.answer = answered({ crmDashboard: dashboard });
});

describe('CRM overview', () => {
  it('shows the headline numbers and the findings for the period', () => {
    renderPage();

    expect(screen.getByText('Meetings booked')).toBeInTheDocument();
    expect(screen.getByText('2 (67%)')).toBeInTheDocument();
    expect(screen.getByText('New companies')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2 reminders are overdue' })).toHaveAttribute(
      'href',
      '/calendar',
    );
    expect(
      screen.getByRole('link', {
        name: 'Leads from Referral convert 2× better than leads from Website',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Open pipeline by stage')).toBeInTheDocument();
    expect(screen.getByText('Won revenue over time')).toBeInTheDocument();
  });

  it('asks for this month by default and for the quarter once it is chosen, in the address', async () => {
    renderPage();
    const first = hook.variables as { from: string; to: string };

    await userEvent.click(screen.getByRole('button', { name: 'This quarter' }));

    expect(screen.getByLabelText('url')).toHaveTextContent('/?period=quarter');
    expect((hook.variables as { to: string }).to).not.toBe(first.to);
  });

  it('waits for both days of a custom period before asking', () => {
    renderPage('/?period=custom&from=2026-03-01');

    expect(hook.skip).toBe(true);
    expect(screen.getByText('Pick a start and an end day')).toBeInTheDocument();
    expect(screen.getAllByLabelText('From').length).toBeGreaterThan(0);
  });

  it('shows a placeholder while the first answer is on its way', () => {
    hook.answer = pending();
    renderPage();

    expect(screen.getByText('Loading the CRM dashboard')).toBeInTheDocument();
  });

  it('says when the dashboard failed and offers to try again', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    hook.answer = { data: undefined, loading: false, error: new Error('Network down'), refetch };
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Network down')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });

  it('says so when nothing stands out', () => {
    hook.answer = answered({ crmDashboard: { ...dashboard, insights: [] } });
    renderPage();

    expect(screen.getByText('Nothing stands out in this period yet.')).toBeInTheDocument();
  });
});
