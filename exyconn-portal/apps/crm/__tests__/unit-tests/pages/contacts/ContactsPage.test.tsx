import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListContactsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ContactsPage } from '../../../../src/pages/contacts';
import { CONTACT_COLUMNS } from '../../../../src/pages/contacts/contacts-grid';
import { renderWithProviders } from '../../test-utils';
import { contactRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteContact: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListContactsStatsQuery: () => gql.stats(),
  useDeleteContactMutation: () => [gql.deleteContact],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/contacts/forms/contact', async () => ({
  ContactForm: (await import('../../form-stub')).FormStub,
}));

const STATS = tableStats(9, { status: { ACTIVE: 5, UNSUBSCRIBED: 2, LEFT_COMPANY: 1 } });

describe('ContactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteContact.mockResolvedValue({ data: { deleteContact: true } });
    gql.stats.mockReturnValue({
      data: { listContactsStats: STATS },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the contacts by status from the stats query', () => {
    renderWithProviders(<ContactsPage />);

    expect(statLines()).toEqual(['Contacts: 9', 'Active: 5', 'Unsubscribed: 2', 'Left company: 1']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows loading tiles at zero until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<ContactsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()).toEqual(['Contacts: 0', 'Active: 0', 'Unsubscribed: 0', 'Left company: 0']);
  });

  it('drives the server grid with the paged contacts query and the contact columns', () => {
    renderWithProviders(<ContactsPage />);
    const page = { totalCount: 1, rows: [contactRow()] };

    expect(paged.document).toBe(ListContactsPagedDocument);
    expect(paged.select?.({ listContactsPaged: page } as never)).toBe(page);
    expect(dashboardProps().fetchRows).toBe(paged.fetchRows);
    expect(dashboardProps().columnDefs).toBe(CONTACT_COLUMNS);
    expect(dashboardProps()).toMatchObject({
      title: 'Contacts',
      entityLabel: 'contact',
      exportFileName: 'contacts',
    });
  });

  it('opens a blank form for a new contact and closes it on cancel', async () => {
    renderWithProviders(<ContactsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
  });

  it('edits the row the grid hands over, then reloads the stats once saved', async () => {
    renderWithProviders(<ContactsPage />);

    await runRowAction('edit', contactRow({ name: 'Ravi Menon' }));
    expect(screen.getByText(/"name":"Ravi Menon"/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Ravi Menon/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a contact after confirming, by its id', async () => {
    renderWithProviders(<ContactsPage />);

    await confirmRowDelete(contactRow({ id: 'contact-7' }), 'Delete contact "Asha Rao"?');

    expect(gql.deleteContact).toHaveBeenCalledWith({ variables: { id: 'contact-7' } });
    expect(await screen.findByText('Contact deleted')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
