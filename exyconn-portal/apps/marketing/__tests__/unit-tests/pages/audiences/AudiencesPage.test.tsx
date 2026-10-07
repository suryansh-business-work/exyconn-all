import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudienceSegment, ListAudienceListsPagedDocument } from '@exyconn/shell/graphql/generated';
import { AudiencesPage } from '../../../../src/pages/audiences';
import { AUDIENCE_COLUMNS } from '../../../../src/pages/audiences/audiences-grid';
import { renderWithProviders } from '../../test-utils';
import { answered, audienceRow, pending } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({
  audiences: vi.fn(),
  clients: vi.fn(),
  refetch: vi.fn(),
  deleteAudience: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAudienceListsQuery: () => gql.audiences(),
  useListClientsQuery: () => gql.clients(),
  useDeleteAudienceListMutation: () => [gql.deleteAudience],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/audiences/forms/audience-list', async () => ({
  AudienceListForm: (await import('../../form-stub')).FormStub,
}));

vi.mock('../../../../src/pages/audiences/AudienceMembers', () => ({
  AudienceMembers: ({ audienceId, audienceName }: Readonly<Record<string, string>>) => (
    <p>{`Members of ${audienceName} (${audienceId})`}</p>
  ),
}));

const AUDIENCES = [
  audienceRow({ id: 'a1', clientIds: ['c1', 'c2'], contactIds: ['p1'] }),
  audienceRow({
    id: 'a2',
    clientIds: ['c2'],
    contactIds: ['p1', 'p2'],
    dynamicSegment: AudienceSegment.AllActiveClients,
  }),
];

function loaded(clients: number) {
  gql.audiences.mockReturnValue({
    ...answered({ listAudienceLists: AUDIENCES }),
    refetch: gql.refetch,
  });
  gql.clients.mockReturnValue(
    answered({ listClients: Array.from({ length: clients }, (_, index) => ({ id: `c${index}` })) }),
  );
}

describe('AudiencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteAudience.mockResolvedValue({ data: { deleteAudienceList: true } });
    loaded(3);
  });

  it('counts the audiences and the distinct people they name', () => {
    renderWithProviders(<AudiencesPage />);

    expect(statLines()).toEqual([
      'Audiences: 2',
      'Clients named: 2',
      'Contacts named: 2',
      'With a segment rule: 1',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('says how many clients are available, in a sentence that agrees with the count', () => {
    renderWithProviders(<AudiencesPage />);
    expect(dashboardProps().subtitle).toBe('Who a campaign goes to — {count} clients available');
    expect(dashboardProps().subtitleValues).toEqual({ count: 3 });
  });

  it('uses the singular sentence for exactly one client', () => {
    loaded(1);
    renderWithProviders(<AudiencesPage />);

    expect(dashboardProps().subtitle).toBe('Who a campaign goes to — {count} client available');
  });

  it('shows zeros and loading tiles until the audiences arrive', () => {
    gql.audiences.mockReturnValue(pending());
    gql.clients.mockReturnValue(pending());
    renderWithProviders(<AudiencesPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(dashboardProps().subtitleValues).toEqual({ count: 0 });
    expect(statLines()).toEqual([
      'Audiences: 0',
      'Clients named: 0',
      'Contacts named: 0',
      'With a segment rule: 0',
    ]);
  });

  it('drives the server grid with the paged audiences query and the audience columns', () => {
    renderWithProviders(<AudiencesPage />);
    const page = { totalCount: 1, rows: [audienceRow()] };

    expect(paged.document).toBe(ListAudienceListsPagedDocument);
    expect(paged.select?.({ listAudienceListsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(AUDIENCE_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Audiences', entityLabel: 'audience' });
  });

  it('opens the members drawer for a row and closes it again', async () => {
    renderWithProviders(<AudiencesPage />);

    act(() => {
      dashboardProps().context.actions.members(audienceRow({ id: 'a9', name: 'VIPs' }));
    });
    expect(await screen.findByText('Members of VIPs (a9)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText(/Members of VIPs/)).not.toBeInTheDocument());
  });

  it('opens a blank form for a new audience and closes it on cancel', async () => {
    renderWithProviders(<AudiencesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
  });

  it('edits the row the grid hands over, then reloads the list once saved', async () => {
    renderWithProviders(<AudiencesPage />);

    await runRowAction('edit', audienceRow({ name: 'Partners' }));
    expect(screen.getByText(/"name":"Partners"/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Partners/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes an audience after confirming, by its id', async () => {
    renderWithProviders(<AudiencesPage />);

    await confirmRowDelete(audienceRow({ id: 'a7' }), 'Delete audience "Newsletter"?');

    expect(gql.deleteAudience).toHaveBeenCalledWith({ variables: { id: 'a7' } });
    expect(await screen.findByText('Audience deleted')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
