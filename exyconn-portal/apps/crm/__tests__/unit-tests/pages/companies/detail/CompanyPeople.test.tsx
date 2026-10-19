import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { FilterOp } from '@exyconn/shell/graphql/generated';
import { CompanyPeople } from '../../../../../src/pages/companies/detail/CompanyPeople';
import { renderWithProviders } from '../../../test-utils';
import { contactRow } from '../../../fixtures';

const gql = vi.hoisted(() => ({ people: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListContactsPagedQuery: (options: unknown) => gql.people(options),
}));

const page = (rows: ReturnType<typeof contactRow>[]) => ({
  data: { listContactsPaged: { totalCount: rows.length, rows } },
  loading: false,
});

describe('CompanyPeople', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.people.mockReturnValue(page([]));
  });

  it('asks for the first hundred contacts filed under the company', () => {
    renderWithProviders(<CompanyPeople companyId="company-7" />);

    expect(gql.people).toHaveBeenCalledWith({
      variables: {
        input: {
          page: 0,
          pageSize: 100,
          filters: [{ field: 'companyId', op: FilterOp.Equals, value: 'company-7' }],
        },
      },
    });
  });

  it('shows a skeleton until the first answer', () => {
    gql.people.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<CompanyPeople companyId="company-1" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading the people');
  });

  it('keeps the people on screen while a later load runs', () => {
    gql.people.mockReturnValue({ ...page([contactRow()]), loading: true });
    renderWithProviders(<CompanyPeople companyId="company-1" />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Asha Rao' })).toBeInTheDocument();
  });

  it('says why the people could not load', () => {
    gql.people.mockReturnValue({ data: undefined, loading: false, error: new Error('Denied') });
    renderWithProviders(<CompanyPeople companyId="company-1" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Denied');
  });

  it('says so when nobody at the company is in the CRM', () => {
    renderWithProviders(<CompanyPeople companyId="company-1" />);

    expect(screen.getByText('Nobody at this company is in the CRM yet.')).toBeInTheDocument();
  });

  it('treats a missing answer as nobody', () => {
    gql.people.mockReturnValue({ data: undefined, loading: false });
    renderWithProviders(<CompanyPeople companyId="company-1" />);

    expect(screen.getByText('Nobody at this company is in the CRM yet.')).toBeInTheDocument();
  });

  it('links each person to their page with their title and email beside the name', () => {
    gql.people.mockReturnValue(
      page([
        contactRow(),
        contactRow({ id: 'contact-2', name: 'Ravi Kumar', title: '', email: 'ravi@acme.io' }),
        contactRow({ id: 'contact-3', name: 'Meera Shah', title: '', email: '' }),
      ]),
    );
    renderWithProviders(<CompanyPeople companyId="company-1" />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByRole('link', { name: 'Asha Rao' })).toHaveAttribute(
      'href',
      '/contacts/contact-1',
    );
    expect(items[0]).toHaveTextContent('CTO · asha@acme.io');
    expect(items[1]).toHaveTextContent(/Ravi Kumarravi@acme\.io$/);
    expect(items[2].textContent?.endsWith('Meera Shah')).toBe(true);
  });
});
