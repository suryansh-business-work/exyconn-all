import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type {
  OverviewBreakdown,
  OverviewLink,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { AgentsOverviewPage } from '../../../../src/pages/overview';
import type { AgentsOverview } from '../../../../src/pages/overview/agents-overview.summary';
import { renderWithProviders } from '../../test-utils';

interface OverviewProps {
  title: string;
  stats: StatItem[];
  statsLoading: boolean;
  breakdowns: OverviewBreakdown[];
  links: OverviewLink[];
  children: ReactNode;
}

const state = vi.hoisted(() => ({
  props: null as null | OverviewProps,
  query: vi.fn(),
  warn: vi.fn(),
}));

/** The real overview lays out cards and charts; the stand-in records what it was given. */
vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps>) => {
    state.props = props;
    return props.children;
  },
}));
vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => `day ${value}` }),
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: { warn: state.warn },
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAgentsOverviewQuery: state.query,
}));

const overview: AgentsOverview = {
  days: 30,
  from: '2026-10-03',
  to: '2026-11-01',
  conversations: 40,
  whatsappSessions: 12,
  whatsappCompletionRate: 0.5,
  websiteAgentSessions: 8,
  websiteChats: 10,
  websiteChatsAnsweredByPeople: 3,
  deflectionRate: 0.7,
  calls: 10,
  callsCompleted: 6,
  callsFailed: 1,
  leadsCaptured: 5,
};

const props = () => {
  if (!state.props) {
    throw new Error('ModuleOverview was not rendered');
  }
  return state.props;
};

const answer = (result: Record<string, unknown>) =>
  state.query.mockReturnValue({ refetch: vi.fn(), ...result });

describe('AgentsOverviewPage', () => {
  beforeEach(() => {
    state.props = null;
    state.query.mockReset();
    state.warn.mockReset();
  });

  it('asks for the last 30 days, fresh on every visit', () => {
    answer({ data: undefined, loading: true });
    renderWithProviders(<AgentsOverviewPage />);
    expect(state.query).toHaveBeenCalledWith({
      variables: { days: 30 },
      fetchPolicy: 'cache-and-network',
    });
    expect(props().statsLoading).toBe(true);
    expect(props().stats.map((stat) => stat.value)).toEqual(['0', '0', '0', '0%']);
  });

  it('lays out the four numbers, the breakdowns, the links and the range', () => {
    answer({ data: { agentsOverview: overview }, loading: true });
    renderWithProviders(<AgentsOverviewPage />);
    expect(props().title).toBe('Agents');
    // Data already on screen is not hidden behind a skeleton while it refreshes.
    expect(props().statsLoading).toBe(false);
    expect(props().stats.map((stat) => stat.value)).toEqual(['40', '5', '10', '70%']);
    expect(props().breakdowns.map((breakdown) => breakdown.title)).toEqual([
      'Conversations by agent',
      'Calls by outcome',
      'Live website chats',
    ]);
    expect(props().links.map((link) => link.to)).toEqual([
      '/agents/whatsapp',
      '/agents/calling-bot',
      '/agents/website-bot',
      '/agents/chat/sessions',
      '/agents/whatsapp-leads',
    ]);
    expect(screen.getByText('Counted from day 2026-10-03 to day 2026-11-01.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says why the overview failed and tries again on Retry', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    answer({ data: undefined, loading: false, error: new Error('Forbidden'), refetch });
    renderWithProviders(<AgentsOverviewPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The overview could not be loaded. Forbidden',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(state.warn).not.toHaveBeenCalled());
  });

  it('falls back to a plain sentence for a non-Error and logs a failed retry', async () => {
    const failure = new Error('offline');
    const refetch = vi.fn().mockRejectedValue(failure);
    answer({ data: undefined, loading: false, error: 'boom', refetch });
    renderWithProviders(<AgentsOverviewPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('The server did not answer.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(state.warn).toHaveBeenCalledWith('Agents overview: retry failed', failure),
    );
  });
});
