import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { OverviewLink } from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { DashboardPage } from '../../../../src/pages/dashboard';
import { emptyDashboard } from './dashboard.fixtures';
import { renderWithProviders } from '../../test-utils';

interface OverviewProps {
  title: string;
  stats: StatItem[];
  statsLoading: boolean;
  links: OverviewLink[];
  recentTitle: string;
  children: ReactNode;
}

const state = vi.hoisted(() => ({ props: null as null | OverviewProps, query: vi.fn() }));

/** The real overview lays out cards and links; the stand-in records what it was given. */
vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps>) => {
    state.props = props;
    return props.children;
  },
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useItDashboardQuery: state.query,
}));

const props = () => {
  if (!state.props) {
    throw new Error('ModuleOverview was not rendered');
  }
  return state.props;
};

const answer = (data: object | undefined, loading: boolean, error?: { message: string }) =>
  state.query.mockReturnValue({ data, loading, error });

describe('DashboardPage', () => {
  beforeEach(() => {
    state.props = null;
    state.query.mockReset();
  });

  it('asks for the dashboard fresh on every visit and shows a spinner until it answers', () => {
    answer(undefined, true);
    renderWithProviders(<DashboardPage />);
    expect(state.query).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(props().statsLoading).toBe(true);
    expect(props().stats).toEqual([]);
  });

  it('lays out the eight numbers IT looks at first, most urgent first', () => {
    answer({ itDashboard: emptyDashboard() }, true);
    renderWithProviders(<DashboardPage />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(props().title).toBe('IT');
    expect(props().statsLoading).toBe(false);
    expect(props().stats.map((stat) => [stat.label, stat.value])).toEqual([
      ['Open IT tickets', '12'],
      ['Overdue tickets', '3'],
      ['Active incidents', '2'],
      ['Outages', '1'],
      ['Pending approvals', '8'],
      ['Assets assigned', '31 / 40'],
      ['Expiring soon', '6'],
      ['Critical vulnerabilities', '2'],
    ]);
    expect(props().recentTitle).toBe('What needs attention');
    expect(screen.getByText('No incidents recorded.')).toBeInTheDocument();
  });

  it('links every tile to the screen behind it', () => {
    answer(undefined, false);
    renderWithProviders(<DashboardPage />);
    expect(props().links.map((link) => link.to)).toEqual([
      '/it/helpdesk',
      '/it/incidents',
      '/it/access',
      '/it/changes',
      '/it/assets',
      '/it/security',
    ]);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('says why the dashboard could not load', () => {
    answer(undefined, false, { message: 'Network down' });
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('The dashboard could not load: Network down')).toBeInTheDocument();
    expect(screen.queryByText('No incidents recorded.')).not.toBeInTheDocument();
  });
});
