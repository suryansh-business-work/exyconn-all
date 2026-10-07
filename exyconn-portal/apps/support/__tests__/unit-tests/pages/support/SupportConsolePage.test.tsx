import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterOp, ListSupportTicketsPagedDocument } from '@exyconn/shell/graphql/generated';
import { TICKET_COLUMNS } from '../../../../src/pages/support/tickets-grid';
import { dashboardProps, fetcherCall, fetchRows, statValues } from '../../crud-page.mocks';
import { formatDate } from '../../settings.mock';
import { click } from '../../form.helpers';
import { tableStats } from '../../fixtures';
import { consoleGql as gql } from './console.state';
import { ROW, renderConsole, resetConsole } from './console.harness';

vi.mock('@exyconn/crud', async () => (await import('../../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/auth/AuthContext', async (importOriginal) => {
  const { consoleGql } = await import('./console.state');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/auth/AuthContext')>()),
    useAuth: () => ({ user: consoleGql.user }),
  };
});
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const { consoleGql } = await import('./console.state');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
    useListSupportTicketsStatsQuery: consoleGql.stats,
    useSupportSlaSummaryQuery: consoleGql.sla,
  };
});
vi.mock('@exyconn/shell/pages/ticket-desk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/pages/ticket-desk')>()),
  TicketDetailDialog: (await import('./console.stubs')).DetailDialogStub,
}));
vi.mock('../../../../src/pages/support/TicketStatusDialog', async () => ({
  TicketStatusDialog: (await import('./console.stubs')).StatusDialogStub,
}));
vi.mock('../../../../src/pages/support/forms/client-ticket', async () => ({
  ClientTicketForm: (await import('./console.stubs')).ClientTicketFormStub,
}));

describe('SupportConsolePage', () => {
  beforeEach(resetConsole);

  it('frames every ticket in one server-paged grid, dated in the viewer’s format', () => {
    renderConsole();
    expect(dashboardProps()).toMatchObject({
      title: 'Support',
      subtitle: 'Employee & customer tickets',
      entityLabel: 'ticket',
      searchPlaceholder: 'Search by subject, requester, reference or assignee…',
      refreshSignal: 0,
      fetchRows,
    });
    expect(dashboardProps().columnDefs).toBe(TICKET_COLUMNS);
    expect(dashboardProps().context.formatDate).toBe(formatDate);
    expect(gql.sla).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('shows placeholders until the numbers first answer', () => {
    renderConsole();
    expect(dashboardProps().statsLoading).toBe(true);
    expect(Object.values(statValues())).toEqual(['0', '0', '0', '0', '0']);
  });

  it('counts tickets by status and priority, and the SLA breaches', () => {
    gql.stats.mockReturnValue({
      data: {
        listSupportTicketsStats: tableStats(12, {
          status: { OPEN: 5, IN_PROGRESS: 3 },
          priority: { HIGH: 2 },
        }),
      },
      loading: false,
      refetch: gql.refetchStats,
    });
    gql.sla.mockReturnValue({
      data: { supportSlaSummary: { onTrack: 6, dueSoon: 2, breached: 4 } },
      refetch: gql.refetchSla,
    });
    renderConsole();
    expect(statValues()).toEqual({
      Tickets: '12',
      Open: '5',
      'In progress': '3',
      'High priority': '2',
      'SLA breached': '4',
    });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('pages every ticket from the paged query with no quick filter at first', () => {
    renderConsole();
    const paged = { rows: [ROW], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListSupportTicketsPagedDocument);
    expect(fetcherCall().select({ listSupportTicketsPaged: paged })).toBe(paged);
    expect(fetcherCall().filters).toEqual([]);
  });

  it('narrows the grid to my tickets and re-reads it', async () => {
    renderConsole();
    await click('Mine');
    expect(fetcherCall().filters).toEqual([
      { field: 'assigneeId', op: FilterOp.Equals, value: 'agent-7' },
    ]);
    expect(dashboardProps().refreshSignal).toBe(1);
    expect(gql.refetchStats).not.toHaveBeenCalled();
  });

  it('matches no assignee for Mine before the session knows who is signed in', async () => {
    gql.user = null;
    renderConsole();
    await click('Mine');
    expect(fetcherCall().filters).toEqual([
      { field: 'assigneeId', op: FilterOp.Equals, value: '' },
    ]);
  });
});
