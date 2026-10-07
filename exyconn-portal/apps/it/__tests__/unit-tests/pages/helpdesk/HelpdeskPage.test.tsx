import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import {
  FilterOp,
  ListSupportTicketsPagedDocument,
  SupportCategory,
} from '@exyconn/shell/graphql/generated';
import { EMPLOYEE_DESK_FILTERS, quickFilters } from '@exyconn/shell/pages/ticket-desk';
import { HelpdeskPage } from '../../../../src/pages/helpdesk';
import { HELPDESK_COLUMNS } from '../../../../src/pages/helpdesk/helpdesk-grid';
import {
  dashboardProps,
  fetchRows,
  fetcherCall,
  resetPage,
  statPairs,
} from '../../core/crud-page.mocks';
import { formatDate } from '../../core/settings.mock';
import { renderWithProviders } from '../../test-utils';

interface DialogProps {
  ticket: object | null;
  topics?: string[];
  onClose: () => void;
  onChanged: () => void;
}

const gql = vi.hoisted(() => ({
  dashboard: vi.fn(),
  sla: vi.fn(),
  settings: vi.fn(),
  refetch: vi.fn(),
  navigate: vi.fn(),
  user: { id: 'u-1' } as { id: string } | null,
  dialog: null as DialogProps | null,
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => gql.navigate,
}));
vi.mock('@exyconn/shell/auth/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/auth/AuthContext')>()),
  useAuth: () => ({ user: gql.user }),
}));
vi.mock('@exyconn/crud', async () => (await import('../../core/crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/pages/ticket-desk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/pages/ticket-desk')>()),
  TicketDetailDialog: (props: Readonly<DialogProps>) => {
    gql.dialog = props;
    return null;
  },
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useItDashboardQuery: gql.dashboard,
  useSupportSlaSummaryQuery: gql.sla,
  useItSettingsQuery: gql.settings,
}));

const IT_ONLY = { field: 'category', op: FilterOp.Equals, value: SupportCategory.It };
const ticket = { id: 't-1', subject: 'Laptop will not boot' };

const dialog = () => {
  if (!gql.dialog) {
    throw new Error('TicketDetailDialog was not rendered');
  }
  return gql.dialog;
};

describe('HelpdeskPage', () => {
  beforeEach(() => {
    resetPage();
    gql.user = { id: 'u-1' };
    gql.dialog = null;
    gql.navigate.mockReset();
    gql.refetch.mockReset().mockResolvedValue({ data: {} });
    gql.dashboard
      .mockReset()
      .mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    gql.sla.mockReset().mockReturnValue({ data: undefined });
    gql.settings.mockReset().mockReturnValue({ data: undefined });
  });

  it("frames IT's slice of the ticket queue, with every ticket shown first", () => {
    renderWithProviders(<HelpdeskPage />);
    const props = dashboardProps();
    expect(props).toMatchObject({
      title: 'IT Helpdesk',
      entityLabel: 'ticket',
      exportFileName: 'it-tickets',
      columnDefs: HELPDESK_COLUMNS,
      fetchRows,
      refreshSignal: 0,
      searchPlaceholder: 'Search by subject, reference or assignee…',
    });
    expect(props.crud).toBeUndefined();
    expect(props.context.formatDate).toBe(formatDate);
    expect(fetcherCall().document).toBe(ListSupportTicketsPagedDocument);
    expect(fetcherCall().filters).toEqual([IT_ONLY, ...quickFilters('all', 'u-1')]);
    const paged = { rows: [ticket], totalCount: 1 };
    expect(fetcherCall().select({ listSupportTicketsPaged: paged })).toBe(paged);
    expect(props.toolbar?.props.only).toBe(EMPLOYEE_DESK_FILTERS);
  });

  it('shows zero tiles until the counts answer, then the queue and the SLA', () => {
    const { rerender } = renderWithProviders(<HelpdeskPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statPairs().map(([, value]) => value)).toEqual(['0', '0', '0', '0']);

    gql.dashboard.mockReturnValue({
      data: { itDashboard: { openTickets: 9, unassignedTickets: 2, overdueTickets: 1 } },
      loading: false,
      refetch: gql.refetch,
    });
    gql.sla.mockReturnValue({ data: { supportSlaSummary: { dueSoon: 4 } } });
    rerender(<HelpdeskPage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs()).toEqual([
      ['Open tickets', '9'],
      ['Unassigned', '2'],
      ['Overdue', '1'],
      ['Due soon', '4'],
    ]);
  });

  it('switches the quick view, re-reads the grid and refreshes the tiles', () => {
    renderWithProviders(<HelpdeskPage />);
    act(() => {
      (dashboardProps().toolbar?.props.onChange as (next: string) => void)('mine');
    });
    expect(dashboardProps().toolbar?.props.value).toBe('mine');
    expect(fetcherCall().filters).toEqual([IT_ONLY, ...quickFilters('mine', 'u-1')]);
    expect(dashboardProps().refreshSignal).toBe(1);
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('filters "mine" by nobody when no one is signed in', () => {
    gql.user = null;
    renderWithProviders(<HelpdeskPage />);
    act(() => {
      (dashboardProps().toolbar?.props.onChange as (next: string) => void)('mine');
    });
    expect(fetcherCall().filters).toEqual([IT_ONLY, ...quickFilters('mine', '')]);
  });

  it('logs, rather than throws, when the tiles cannot refresh', async () => {
    const failure = new Error('offline');
    gql.refetch.mockRejectedValue(failure);
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(<HelpdeskPage />);
    act(() => {
      (dashboardProps().toolbar?.props.onChange as (next: string) => void)('open');
    });
    await waitFor(() => expect(logged).toHaveBeenCalledWith('Could not refresh tiles', failure));
    logged.mockRestore();
  });

  it('opens a clicked ticket in the drawer with IT topics, and closes it again', () => {
    gql.settings.mockReturnValue({ data: { itSettings: { ticketTopics: ['Laptop', 'VPN'] } } });
    renderWithProviders(<HelpdeskPage />);
    expect(dialog().ticket).toBeNull();

    act(() => {
      dashboardProps().onRowClick?.(ticket);
    });
    expect(dialog().ticket).toBe(ticket);
    expect(dialog().topics).toEqual(['Laptop', 'VPN']);

    act(() => {
      dialog().onClose();
    });
    expect(dialog().ticket).toBeNull();
  });

  it('reloads after the ticket changes in the drawer', () => {
    renderWithProviders(<HelpdeskPage />);
    act(() => {
      dashboardProps().context.actions.open(ticket);
    });
    expect(dialog().ticket).toBe(ticket);
    act(() => {
      dialog().onChanged();
    });
    expect(dashboardProps().refreshSignal).toBe(1);
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('opens a ticket on its own page', () => {
    renderWithProviders(<HelpdeskPage />);
    dashboardProps().context.actions.page(ticket);
    expect(gql.navigate).toHaveBeenCalledWith('/it/helpdesk/t-1');
  });
});
