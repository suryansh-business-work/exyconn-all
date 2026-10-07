import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { WhatsappDemoVisitorsPagedDocument } from '@exyconn/shell/graphql/generated';
import { WhatsappLeadsPage } from '../../../../../src/pages/website/whatsapp-leads/WhatsappLeadsPage';
import { WHATSAPP_LEAD_COLUMNS } from '../../../../../src/pages/website/whatsapp-leads/whatsapp-leads-grid';
import { renderWithProviders } from '../../../test-utils';
import { contentDashboard, dashboardProps, paged, statValues } from '../content-dashboard-stub';
import { leadRow } from './fixtures';

const gql = vi.hoisted(() => ({
  stats: { data: undefined as unknown, loading: true },
  refetch: vi.fn(() => Promise.resolve({})),
  deleteVisitor: vi.fn(() => Promise.resolve({})),
  setBlocked: vi.fn(() => Promise.resolve({})),
  confirmFailure: null as Error | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useWhatsappDemoVisitorStatsQuery: () => ({ ...gql.stats, refetch: gql.refetch }),
    useDeleteWhatsappDemoVisitorMutation: () => [gql.deleteVisitor],
    useSetWhatsappDemoVisitorBlockedMutation: () => [gql.setBlocked],
  };
});

vi.mock('@exyconn/crud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/crud')>();
  const stub = await import('../content-dashboard-stub');
  return {
    ...actual,
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>();
  return {
    ...actual,
    useConfirm: () => {
      const confirm = actual.useConfirm();
      const failure = gql.confirmFailure;
      return failure ? () => Promise.reject(failure) : confirm;
    },
  };
});

const STATS = {
  whatsappDemoVisitorStats: {
    total: 9,
    counts: [
      {
        field: 'source',
        buckets: [
          { value: 'WEBSITE', count: 6 },
          { value: 'DEMO_LOGIN', count: 3 },
        ],
      },
      { field: 'blocked', buckets: [{ value: 'true', count: 2 }] },
    ],
    sums: [],
  },
};

function runAction(name: string, blocked = false) {
  act(() => {
    dashboardProps().context.actions[name](leadRow({ blocked }));
  });
}

beforeEach(() => {
  contentDashboard.props = null;
  gql.stats = { data: STATS, loading: false };
  gql.confirmFailure = null;
  gql.refetch.mockClear();
  gql.deleteVisitor.mockClear();
  gql.setBlocked.mockReset();
  gql.setBlocked.mockImplementation(() => Promise.resolve({}));
});

describe('WhatsappLeadsPage', () => {
  it('sums up the leads by where they came from and who is blocked', () => {
    renderWithProviders(<WhatsappLeadsPage />);
    expect(screen.getByRole('heading', { name: 'WhatsApp leads' })).toBeInTheDocument();
    expect(statValues()).toEqual({
      Leads: '9',
      'From the website': '6',
      'From demo sign-in': '3',
      Blocked: '2',
    });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows the stats as loading only until they first arrive', () => {
    gql.stats = { data: undefined, loading: true };
    renderWithProviders(<WhatsappLeadsPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(Object.values(statValues())).toEqual(['0', '0', '0', '0']);

    gql.stats = { data: STATS, loading: true };
    renderWithProviders(<WhatsappLeadsPage />);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('pages through the demo visitors with the lead columns', () => {
    renderWithProviders(<WhatsappLeadsPage />);
    const props = dashboardProps();
    expect(paged.document).toBe(WhatsappDemoVisitorsPagedDocument);
    const page = { totalCount: 1, rows: [leadRow()] };
    expect(paged.select?.({ whatsappDemoVisitorsPaged: page } as never)).toBe(page);
    expect(props.fetchRows).toBe(paged.fetchRows);
    expect(props.columnDefs).toBe(WHATSAPP_LEAD_COLUMNS);
    expect(typeof props.context.formatDate).toBe('function');
    expect(props.entityLabel).toBe('lead');
    expect(props.exportFileName).toBe('whatsapp-demo-leads');
    expect(props.searchPlaceholder).toBe('Search by name, email, company or phone…');
  });

  it('blocks a lead once confirmed, then re-reads the list and stats', async () => {
    renderWithProviders(<WhatsappLeadsPage />);
    runAction('block');
    expect(await screen.findByText('Block demo access')).toBeInTheDocument();
    expect(
      screen.getByText('Asha Rao is signed out of the demo now and cannot get a new code.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Block' }));

    expect(await screen.findByText('Demo access blocked')).toBeInTheDocument();
    expect(gql.setBlocked).toHaveBeenCalledWith({ variables: { id: 'lead-1', blocked: true } });
    expect(gql.refetch).toHaveBeenCalled();
    expect(dashboardProps().refreshSignal).toBe(1);
  });

  it('lets a blocked lead back in once confirmed', async () => {
    renderWithProviders(<WhatsappLeadsPage />);
    runAction('unblock', true);
    expect(await screen.findByText('Allow demo access')).toBeInTheDocument();
    expect(
      screen.getByText('Asha Rao can sign in to the demo again with a new code.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));

    expect(await screen.findByText('Demo access allowed')).toBeInTheDocument();
    expect(gql.setBlocked).toHaveBeenCalledWith({ variables: { id: 'lead-1', blocked: false } });
  });

  it('changes nothing when the prompt is cancelled', async () => {
    renderWithProviders(<WhatsappLeadsPage />);
    runAction('block');
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.setBlocked).not.toHaveBeenCalled();
    expect(dashboardProps().refreshSignal).toBe(0);
  });

  it('says why the access could not be changed', async () => {
    gql.setBlocked.mockImplementation(() => Promise.reject(new Error('Lead not found')));
    renderWithProviders(<WhatsappLeadsPage />);
    runAction('block');
    fireEvent.click(await screen.findByRole('button', { name: 'Block' }));

    expect(await screen.findByText('Lead not found')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
    expect(dashboardProps().refreshSignal).toBe(0);
  });

  it('reports a prompt that could not open', async () => {
    gql.confirmFailure = new Error('Dialog unavailable');
    renderWithProviders(<WhatsappLeadsPage />);
    runAction('unblock', true);

    expect(await screen.findByText('Dialog unavailable')).toBeInTheDocument();
    expect(gql.setBlocked).not.toHaveBeenCalled();
  });

  it('deletes a lead and its demo access once confirmed', async () => {
    renderWithProviders(<WhatsappLeadsPage />);
    runAction('delete');
    expect(
      await screen.findByText('Delete Asha Rao and switch off their demo access?'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Lead deleted')).toBeInTheDocument();
    expect(gql.deleteVisitor).toHaveBeenCalledWith({ variables: { id: 'lead-1' } });
    expect(gql.refetch).toHaveBeenCalled();
    expect(dashboardProps().refreshSignal).toBe(1);
  });
});
