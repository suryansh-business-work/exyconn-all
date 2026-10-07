import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComplianceOverviewQuery } from '@exyconn/shell/graphql/generated';
import type {
  OverviewBreakdown,
  OverviewLink,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { ComplianceOverviewPage } from '../../../../src/pages/overview';
import { renderWithProviders } from '../../test-utils';

interface OverviewProps {
  title: string;
  stats: StatItem[];
  statsLoading: boolean;
  breakdowns: OverviewBreakdown[];
  links: OverviewLink[];
  recentTitle: string;
  children: ReactNode;
}

const state = vi.hoisted(() => ({
  props: null as null | OverviewProps,
  query: vi.fn(),
}));

/** The real overview lays out cards and charts; the stand-in records what it was given. */
vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps>) => {
    state.props = props;
    return props.children;
  },
}));
vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => `on ${value}` }),
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useComplianceOverviewQuery: state.query,
}));

const slice = (label: string, value: number) => ({ label, value });

const overview: ComplianceOverviewQuery['complianceOverview'] = {
  risks: 9,
  openRisks: 7,
  risksPastReview: 2,
  findings: 6,
  openFindings: 4,
  findingsOverdue: 3,
  audits: 5,
  auditsPlanned: 2,
  objectives: 4,
  objectivesAtRisk: 1,
  reviews: 1,
  lastReviewOn: '2026-09-30',
  lastReviewTitle: 'Q3 review',
  risksByStatus: [slice('TREATING', 5), slice('CLOSED', 2)],
  findingsByType: [slice('MAJOR_NONCONFORMITY', 1)],
  residualHeat: [slice('HIGH', 3)],
  standardCoverage: [slice('ISO 9001', 0)],
};

const props = () => {
  if (!state.props) {
    throw new Error('ModuleOverview was not rendered');
  }
  return state.props;
};

const answer = (data: ComplianceOverviewQuery | undefined, loading: boolean) =>
  state.query.mockReturnValue({ data, loading });

describe('ComplianceOverviewPage', () => {
  beforeEach(() => {
    state.props = null;
    state.query.mockReset();
  });

  it('asks for the overview fresh on every visit', () => {
    answer(undefined, true);
    renderWithProviders(<ComplianceOverviewPage />);
    expect(state.query).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('shows a spinner and zeroed placeholder cards until the first answer', () => {
    answer(undefined, true);
    renderWithProviders(<ComplianceOverviewPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(props().statsLoading).toBe(true);
    expect(props().stats.map((stat) => stat.value)).toEqual(['0', '0', '0', '0']);
    expect(props().breakdowns.map((breakdown) => breakdown.buckets)).toEqual([[], []]);
  });

  it('lays out the four numbers an auditor opens with and the two breakdowns', () => {
    answer({ complianceOverview: overview }, false);
    renderWithProviders(<ComplianceOverviewPage />);
    expect(props().title).toBe('Compliance');
    expect(props().statsLoading).toBe(false);
    expect(props().stats.map((stat) => [stat.label, stat.value])).toEqual([
      ['Open risks', '7'],
      ['Open findings', '4'],
      ['Overdue actions', '3'],
      ['Audits planned', '2'],
    ]);
    expect(props().breakdowns.map((breakdown) => [breakdown.title, breakdown.buckets])).toEqual([
      [
        'Risks by status',
        [
          { value: 'TREATING', count: 5 },
          { value: 'CLOSED', count: 2 },
        ],
      ],
      ['Findings by type', [{ value: 'MAJOR_NONCONFORMITY', count: 1 }]],
    ]);
    expect(props().links.map((link) => link.to)).toEqual([
      '/compliance',
      '/compliance/findings',
      '/compliance/audits',
    ]);
  });

  it('answers what an auditor will ask, from the same overview', () => {
    answer({ complianceOverview: overview }, true);
    renderWithProviders(<ComplianceOverviewPage />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(props().recentTitle).toBe('What an auditor will ask about');
    expect(
      screen.getByText('3 corrective action(s) are past their agreed date.'),
    ).toBeInTheDocument();
    expect(screen.getByText('HIGH · 3')).toBeInTheDocument();
    expect(screen.getByText('No audit on file for: ISO 9001')).toBeInTheDocument();
    expect(screen.getByText('Q3 review — on 2026-09-30')).toBeInTheDocument();
  });

  it('shows an empty management system, not a spinner, when the overview never arrives', () => {
    answer(undefined, false);
    renderWithProviders(<ComplianceOverviewPage />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('No open risks on the register.')).toBeInTheDocument();
    expect(screen.getByText('Leadership has never recorded one.')).toBeInTheDocument();
  });
});
