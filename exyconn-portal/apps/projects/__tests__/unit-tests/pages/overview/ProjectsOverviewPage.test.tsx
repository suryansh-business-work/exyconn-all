import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ProjectRisk } from '@exyconn/shell/graphql/generated';
import { ProjectsOverviewPage } from '../../../../src/pages/overview';
import type { PortfolioRow } from '../../../../src/pages/overview/portfolio';
import { renderWithProviders } from '../../test-utils';
import { pending, portfolioRow, tableStats } from '../../fixtures';

interface OverviewProps {
  stats: { label: string; value: string }[];
  statsLoading: boolean;
  breakdowns: { title: string; buckets: unknown[] }[];
  links: { label: string; to: string }[];
  recentTitle: string;
}

interface TableProps {
  rows: PortfolioRow[];
  loading: boolean;
  onRefresh: () => unknown;
}

const recorded = vi.hoisted(() => ({
  overview: null as unknown,
  table: null as unknown,
  hooks: {} as Record<string, (options?: unknown) => unknown>,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListProjectsStatsQuery: () => recorded.hooks.projectStats(),
  useListBugsStatsQuery: () => recorded.hooks.bugStats(),
  useProjectHealthOverviewQuery: (options: unknown) => recorded.hooks.health(options),
}));

vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps & { children: ReactNode }>) => {
    recorded.overview = props;
    return <section aria-label="overview">{props.children}</section>;
  },
}));

vi.mock('../../../../src/pages/overview/portfolio', () => ({
  PortfolioTable: (props: Readonly<TableProps>) => {
    recorded.table = props;
    return <p>{`${props.rows.length} portfolio rows`}</p>;
  },
}));

const overview = () => recorded.overview as OverviewProps;
const table = () => recorded.table as TableProps;
const refetch = vi.fn();
const healthOptions = vi.fn();

describe('ProjectsOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recorded.hooks.projectStats = () => ({
      data: { listProjectsStats: tableStats(6, { status: { ACTIVE: 4, ON_HOLD: 2 } }) },
      loading: false,
    });
    recorded.hooks.bugStats = () => ({
      data: {
        listBugsStats: tableStats(9, {
          status: { OPEN: 3, IN_PROGRESS: 2, RESOLVED: 4 },
          severity: { CRITICAL: 1, LOW: 8 },
        }),
      },
      loading: false,
    });
    recorded.hooks.health = (options: unknown) => {
      healthOptions(options);
      return {
        data: {
          projectHealthOverview: [
            portfolioRow({ projectId: 'p1', risk: ProjectRisk.High }),
            portfolioRow({ projectId: 'p2', risk: ProjectRisk.Low }),
            portfolioRow({ projectId: 'p3', risk: ProjectRisk.High }),
          ],
        },
        loading: false,
        refetch,
      };
    };
  });

  it('counts projects, active ones, the ones at risk and the bugs still open', () => {
    renderWithProviders(<ProjectsOverviewPage />);

    expect(overview().stats.map((stat) => `${stat.label}: ${stat.value}`)).toEqual([
      'Projects: 6',
      'Active: 4',
      'At risk: 2',
      'Open bugs: 5',
    ]);
    expect(overview().statsLoading).toBe(false);
  });

  it('breaks projects down by status and bugs by severity', () => {
    renderWithProviders(<ProjectsOverviewPage />);

    expect(overview().breakdowns).toEqual([
      expect.objectContaining({
        title: 'Projects by status',
        buckets: [
          { value: 'ACTIVE', count: 4 },
          { value: 'ON_HOLD', count: 2 },
        ],
      }),
      expect.objectContaining({
        title: 'Bugs by severity',
        buckets: [
          { value: 'CRITICAL', count: 1 },
          { value: 'LOW', count: 8 },
        ],
      }),
    ]);
    expect(overview().links.map((link) => link.to)).toEqual(['/projects/list', '/bugs']);
  });

  it('hands the portfolio to the table keyed by project, with its refresh', () => {
    renderWithProviders(<ProjectsOverviewPage />);

    expect(screen.getByText('3 portfolio rows')).toBeInTheDocument();
    expect(table().rows.map((row) => row.id)).toEqual(['p1', 'p2', 'p3']);
    expect(table().loading).toBe(false);
    expect(table().onRefresh).toBe(refetch);
    expect(healthOptions).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('shows placeholders until any of the three queries first answers', () => {
    recorded.hooks.bugStats = pending;
    renderWithProviders(<ProjectsOverviewPage />);

    expect(overview().statsLoading).toBe(true);
  });

  it('shows placeholders while the portfolio is still loading', () => {
    recorded.hooks.health = () => ({ ...pending(), refetch });
    renderWithProviders(<ProjectsOverviewPage />);

    expect(overview().statsLoading).toBe(true);
    expect(table().rows).toEqual([]);
    expect(table().loading).toBe(true);
  });

  it('shows placeholders while the project counts are loading, then zeros with no buckets', () => {
    recorded.hooks.projectStats = pending;
    recorded.hooks.bugStats = () => ({ data: undefined, loading: false });
    renderWithProviders(<ProjectsOverviewPage />);

    expect(overview().statsLoading).toBe(true);
    expect(overview().stats.map((stat) => stat.value)).toEqual(['0', '0', '2', '0']);
    expect(overview().breakdowns.map((breakdown) => breakdown.buckets)).toEqual([[], []]);
  });
});
