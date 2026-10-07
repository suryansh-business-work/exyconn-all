import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FilterOp,
  SupportPriority,
  SupportRequester,
  SupportStatus,
  type ListSupportTicketsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import type {
  OverviewBreakdown,
  OverviewLink,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { SupportOverviewPage } from '../../../../src/pages/support';
import { renderWithProviders } from '../../test-utils';
import { tableStats, ticketRow } from '../../fixtures';

interface OverviewProps {
  title: string;
  subtitle: string;
  stats: StatItem[];
  statsLoading: boolean;
  breakdowns: OverviewBreakdown[];
  links: OverviewLink[];
  recentTitle: string;
  children: ReactNode;
}

const state = vi.hoisted(() => ({
  props: null as null | OverviewProps,
  stats: vi.fn(),
  open: vi.fn(),
  refetch: vi.fn(),
}));

/** The real overview lays out cards and charts; the stand-in records what it was given. */
vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps>) => {
    state.props = props;
    return props.children;
  },
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListSupportTicketsStatsQuery: state.stats,
  useListSupportTicketsPagedQuery: state.open,
}));

type TicketRow = ListSupportTicketsPagedQuery['listSupportTicketsPaged']['rows'][number];

const props = () => {
  if (!state.props) {
    throw new Error('ModuleOverview was not rendered');
  }
  return state.props;
};

const tiles = () => Object.fromEntries(props().stats.map((stat) => [stat.label, stat.value]));

const answerStats = (data: object | undefined, loading = false) =>
  state.stats.mockReturnValue({ data, loading });

const answerOpen = (rows: TicketRow[] | undefined, loading = false) =>
  state.open.mockReturnValue({
    data: rows && { listSupportTicketsPaged: { rows, totalCount: rows.length } },
    loading,
    refetch: state.refetch,
  });

describe('SupportOverviewPage', () => {
  beforeEach(() => {
    state.props = null;
    state.refetch.mockReset().mockResolvedValue({ data: {} });
    answerStats(undefined, true);
    answerOpen(undefined, true);
  });

  it('asks fresh for the numbers and the newest eight open tickets', () => {
    renderWithProviders(<SupportOverviewPage />);
    expect(state.stats).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(state.open).toHaveBeenCalledWith({
      variables: {
        input: {
          page: 0,
          pageSize: 8,
          filters: [{ field: 'status', op: FilterOp.Equals, value: SupportStatus.Open }],
        },
      },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('shows placeholders and a loading table until the first answer', () => {
    renderWithProviders(<SupportOverviewPage />);
    expect(props().statsLoading).toBe(true);
    expect(tiles()).toEqual({ Tickets: '0', Open: '0', 'High priority': '0', Resolved: '0' });
    expect(props().breakdowns.map((breakdown) => breakdown.buckets)).toEqual([[], []]);
    expect(screen.queryByText('No open tickets.')).not.toBeInTheDocument();
  });

  it('counts waiting work as open plus in progress, and the rest as resolved', () => {
    answerStats({
      listSupportTicketsStats: tableStats(20, {
        status: { OPEN: 5, IN_PROGRESS: 3, RESOLVED: 12 },
        priority: { HIGH: 4 },
        category: { IT: 9, HR: 11 },
      }),
    });
    answerOpen([]);
    renderWithProviders(<SupportOverviewPage />);
    expect(props()).toMatchObject({
      title: 'Support',
      subtitle: 'Tickets at a glance',
      statsLoading: false,
      recentTitle: 'Open tickets',
      links: [{ label: 'Open ticket console', to: '/support/tickets' }],
    });
    expect(tiles()).toEqual({ Tickets: '20', Open: '8', 'High priority': '4', Resolved: '12' });
    expect(props().breakdowns.map((breakdown) => [breakdown.title, breakdown.buckets])).toEqual([
      [
        'By status',
        [
          { value: 'OPEN', count: 5 },
          { value: 'IN_PROGRESS', count: 3 },
          { value: 'RESOLVED', count: 12 },
        ],
      ],
      [
        'By category',
        [
          { value: 'IT', count: 9 },
          { value: 'HR', count: 11 },
        ],
      ],
    ]);
  });

  it('leaves a breakdown empty when the server counted nothing for it', () => {
    answerStats({ listSupportTicketsStats: tableStats(2, { status: { OPEN: 2 } }) }, true);
    answerOpen([]);
    renderWithProviders(<SupportOverviewPage />);
    expect(props().statsLoading).toBe(false);
    expect(props().breakdowns[1].buckets).toEqual([]);
  });

  it('lists each open ticket with who raised it, its chips and when, in the viewer’s format', () => {
    answerOpen([
      ticketRow(),
      ticketRow({
        id: 'ticket-2',
        subject: 'Invoice is wrong',
        requesterType: SupportRequester.Client,
        clientName: 'Acme Inc',
        priority: SupportPriority.Low,
      }),
    ]);
    renderWithProviders(<SupportOverviewPage />);
    const employee = screen.getByText('Laptop will not boot').closest('tr') as HTMLElement;
    expect(within(employee).getByText('Asha Rao')).toBeInTheDocument();
    expect(within(employee).getByText('HIGH')).toBeInTheDocument();
    expect(within(employee).getByText('OPEN')).toBeInTheDocument();
    expect(within(employee).getByText('on 2026-10-01T09:00:00.000Z')).toBeInTheDocument();
    const client = screen.getByText('Invoice is wrong').closest('tr') as HTMLElement;
    expect(within(client).getByText('Acme Inc')).toBeInTheDocument();
    expect(within(client).getByText('LOW')).toBeInTheDocument();
  });

  it('says nothing is waiting when no ticket is open', () => {
    answerOpen([]);
    renderWithProviders(<SupportOverviewPage />);
    expect(screen.getByText('No open tickets.')).toBeInTheDocument();
  });

  it('treats a list that never arrived as empty once loading stops', () => {
    answerOpen(undefined, false);
    renderWithProviders(<SupportOverviewPage />);
    expect(screen.getByText('No open tickets.')).toBeInTheDocument();
  });

  it('reloads the open tickets from the table refresh button', async () => {
    answerOpen([ticketRow()]);
    renderWithProviders(<SupportOverviewPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });
});
