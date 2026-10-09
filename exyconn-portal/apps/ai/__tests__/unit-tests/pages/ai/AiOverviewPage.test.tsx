import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { OverviewBreakdown } from '@exyconn/shell/components/dashboard/ModuleOverview';
import { AiJobStatus, type ListAiJobsQuery } from '@exyconn/shell/graphql/generated';
import { AiOverviewPage } from '../../../../src/pages/ai/AiOverviewPage';
import { monthToDate } from '../../../../src/pages/ai/ai.period';
import { renderWithProviders } from '../../test-utils';
import { tableStats } from './ai-fixtures';

interface OverviewProps {
  stats: StatItem[];
  statsLoading: boolean;
  breakdowns: OverviewBreakdown[];
  links: Array<{ label: string; to: string }>;
  recentTitle: string;
  children: ReactNode;
}

/** What a mocked query hook answers with. */
type Answer = { data?: unknown; loading: boolean };

type Job = ListAiJobsQuery['listAiJobs'][number];

const q = vi.hoisted(() => ({
  jobStats: { loading: false } as Answer,
  promptStats: { loading: false } as Answer,
  jobs: { loading: false } as Answer,
  spend: { loading: false } as Answer,
  limit: { loading: false } as Answer,
  spendOptions: undefined as unknown,
  refetchJobs: vi.fn(),
  refetchSpend: vi.fn(),
  overview: null as unknown,
  panel: null as unknown,
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAiJobsStatsQuery: () => q.jobStats,
  useListPromptsStatsQuery: () => q.promptStats,
  useListAiJobsQuery: () => ({ ...q.jobs, refetch: q.refetchJobs }),
  useAiSpendSummaryQuery: (options: unknown) => {
    q.spendOptions = options;
    return { ...q.spend, refetch: q.refetchSpend };
  },
  useAiSpendLimitQuery: () => q.limit,
}));

/** The overview frame lays out charts jsdom cannot draw; the stand-in records its props. */
vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<{ children: ReactNode }>) => {
    q.overview = props;
    return <>{props.children}</>;
  },
}));

vi.mock('../../../../src/pages/ai/AiSpendPanel', () => ({
  AiSpendPanel: (props: Readonly<object>) => {
    q.panel = props;
    return null;
  },
}));

const overview = () => q.overview as OverviewProps;
const tiles = () => overview().stats.map((s) => [s.label, s.value]);

const job = (n: number, status = AiJobStatus.Succeeded): Job => ({
  id: `job-${n}`,
  name: `Job ${n}`,
  model: 'gpt-4o',
  prompt: 'Summarise',
  status,
  totalTokens: 12345,
});

const JOB_STATS = tableStats(
  10,
  { status: { SUCCEEDED: 7, FAILED: 3 }, model: { 'gpt-4o': 10 } },
  { costUsd: 4.567 },
);
const SUMMARY = { totalUsd: 12.3, byUser: [], byModel: [] };

const DEFAULT_LIMIT = { monthlyUsdCap: 50, perUserDailyUsdCap: 5, enabled: true };

function answerEverything(limit = DEFAULT_LIMIT) {
  q.jobStats = { data: { listAiJobsStats: JOB_STATS }, loading: false };
  q.promptStats = { data: { listPromptsStats: tableStats(6, {}) }, loading: false };
  q.spend = { data: { aiSpendSummary: SUMMARY }, loading: false };
  q.limit = { data: { aiSpendLimit: limit }, loading: false };
}

describe('AiOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of ['jobStats', 'promptStats', 'jobs', 'spend', 'limit'] as const) {
      q[key] = { loading: true };
    }
  });

  it('shows placeholders, not zeros, until the first answers arrive', () => {
    renderWithProviders(<AiOverviewPage />);
    expect(overview().statsLoading).toBe(true);
    expect(tiles()).toEqual([
      ['Jobs', '0'],
      ['Failed', '0'],
      ['Spent all time', '$0.00'],
      ['This month · {cap}', '$0.00'],
      ['Prompts', '0'],
    ]);
    expect(overview().stats[3].labelValues).toEqual({ cap: 'no cap set' });
    expect(overview().breakdowns.map((b) => b.buckets)).toEqual([[], []]);
    expect(overview().recentTitle).toBe('Newest jobs');
  });

  it('adds up jobs, spend against the monthly cap and prompts, even mid-refetch', () => {
    answerEverything();
    q.limit = { ...q.limit, loading: true };
    renderWithProviders(<AiOverviewPage />);
    expect(overview().statsLoading).toBe(false);
    expect(tiles()).toEqual([
      ['Jobs', '10'],
      ['Failed', '3'],
      ['Spent all time', '$4.57'],
      ['This month · {cap}', '$12.30'],
      ['Prompts', '6'],
    ]);
    expect(overview().stats[3].labelValues).toEqual({ cap: 'of $50.00 cap' });
    expect(overview().breakdowns).toMatchObject([
      { title: 'By status', buckets: JOB_STATS.counts[0].buckets },
      { title: 'By model', buckets: JOB_STATS.counts[1].buckets },
    ]);
    expect(overview().links).toEqual([
      { label: 'Open jobs', to: '/ai/jobs' },
      { label: 'Open prompt library', to: '/ai/prompts' },
    ]);
  });

  it.each([
    ['switched off', { monthlyUsdCap: 50, perUserDailyUsdCap: 5, enabled: false }],
    ['zero', { monthlyUsdCap: 0, perUserDailyUsdCap: 5, enabled: true }],
  ])('reports no cap when the cap is %s', (_case, limit) => {
    answerEverything(limit);
    renderWithProviders(<AiOverviewPage />);
    expect(overview().stats[3].labelValues).toEqual({ cap: 'no cap set' });
  });

  it.each(['promptStats', 'spend', 'limit'] as const)(
    'keeps the tiles loading while %s has not answered',
    (pending) => {
      answerEverything();
      q[pending] = { loading: true };
      renderWithProviders(<AiOverviewPage />);
      expect(overview().statsLoading).toBe(true);
    },
  );

  it('asks for this month’s spend and hands it to the spend panel', () => {
    answerEverything();
    renderWithProviders(<AiOverviewPage />);
    expect(q.spendOptions).toEqual({ variables: monthToDate() });
    expect(q.panel).toEqual({
      summary: SUMMARY,
      loading: false,
      onRefresh: q.refetchSpend,
      periodLabel: 'this month',
    });
  });

  it('lists only the failed jobs when anything failed', () => {
    q.jobs = { data: { listAiJobs: [job(1), job(2, AiJobStatus.Failed)] }, loading: false };
    renderWithProviders(<AiOverviewPage />);
    expect(overview().recentTitle).toBe('Failed jobs');
    expect(screen.getByText('Job 2')).toBeInTheDocument();
    expect(screen.getByText('FAILED')).toBeInTheDocument();
    expect(screen.getByText((12345).toLocaleString())).toBeInTheDocument();
    expect(screen.queryByText('Job 1')).not.toBeInTheDocument();
  });

  it('lists the eight newest jobs when nothing failed', () => {
    const jobs = Array.from({ length: 10 }, (_, i) => job(i + 1));
    q.jobs = { data: { listAiJobs: jobs }, loading: false };
    renderWithProviders(<AiOverviewPage />);
    expect(screen.getByText('Job 1')).toBeInTheDocument();
    expect(screen.getByText('Job 8')).toBeInTheDocument();
    expect(screen.queryByText('Job 9')).not.toBeInTheDocument();
  });

  it('says there are no jobs yet, and re-reads them on refresh', async () => {
    const user = userEvent.setup();
    q.refetchJobs.mockResolvedValue(undefined);
    q.jobs = { data: { listAiJobs: [] }, loading: false };
    renderWithProviders(<AiOverviewPage />);
    expect(screen.getByText('No jobs yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(q.refetchJobs).toHaveBeenCalledTimes(1);
  });
});
