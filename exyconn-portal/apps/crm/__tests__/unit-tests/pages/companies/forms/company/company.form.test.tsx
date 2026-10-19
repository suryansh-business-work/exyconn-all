import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { CompanyStatus } from '@exyconn/shell/graphql/generated';
import { CompanyForm } from '../../../../../../src/pages/companies/forms/company';
import { renderWithProviders } from '../../../../test-utils';
import { companyRow } from '../../../../fixtures';
import { chooseOption, fillField, optionsOf, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCompanyMutation: () => [gql.create],
  useUpdateCompanyMutation: () => [gql.update],
  // The record type has no custom properties: the form renders its built-in fields only.
  useCrmObjectSchemaQuery: () => ({
    data: { crmObjectSchema: { object: 'COMPANY', dedupeKey: '', properties: [] } },
    loading: false,
    refetch: vi.fn(),
  }),
}));

function renderForm(initial: ReturnType<typeof companyRow> | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<CompanyForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

async function fillRequired() {
  await fillField('Company name', 'Globex');
  await fillField('Domain', 'globex.com');
  await fillField('Company owner', 'Priya');
}

describe('CompanyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createCompany: { id: 'company-9' } } });
    gql.update.mockResolvedValue({ data: { updateCompany: { id: 'company-1' } } });
  });

  it('requires a name and a domain, but not an owner', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Domain is required')).toBeInTheDocument();
    expect(screen.queryByText('Owner is required')).not.toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants the domain on its own rather than a URL, and a real phone number', async () => {
    renderForm();
    await fillRequired();
    await fillField('Domain', 'https://globex.com/about');
    await press('Add phone');
    await fillField('Phone', '12');

    await press('Create');

    expect(
      await screen.findByText('Enter the domain on its own, e.g. exyconn.com'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers every size band in words', async () => {
    renderForm();

    expect(await optionsOf('Size')).toEqual([
      'Not known',
      '1-10 people',
      '11-50 people',
      '51-200 people',
      '201-1000 people',
      '1000+ people',
    ]);
  });

  it('creates a prospect with no size unless told otherwise', async () => {
    const { onDone } = renderForm();
    await fillRequired();
    await fillField('Industry', 'Manufacturing');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Globex',
          domain: 'globex.com',
          industry: 'Manufacturing',
          size: '',
          status: CompanyStatus.Prospect,
          emails: [],
          phones: [],
          website: '',
          linkedinUrl: '',
          twitterUrl: '',
          address: '',
          city: '',
          country: '',
          timezone: '',
          description: '',
          logoUrl: '',
          location: '',
          annualRevenue: null,
          employeeCount: null,
          foundedYear: null,
          owner: 'Priya',
          notes: '',
          custom: {},
        },
      },
    });
    expect(await screen.findByText('Company created')).toBeInTheDocument();
  });

  it('hands the new company to the caller that asked for it', async () => {
    gql.create.mockResolvedValueOnce({
      data: { createCompany: { id: 'company-9', name: 'Globex' } },
    });
    const onCreated = vi.fn();
    renderWithProviders(
      <CompanyForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} onCreated={onCreated} />,
    );
    await fillRequired();

    await press('Create');

    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith({ id: 'company-9', name: 'Globex' }),
    );
  });

  it('hands nothing on when the server returns no company', async () => {
    gql.create.mockResolvedValueOnce({ data: { createCompany: null } });
    const onCreated = vi.fn();
    const onDone = vi.fn();
    renderWithProviders(
      <CompanyForm initial={null} onDone={onDone} onCancel={vi.fn()} onCreated={onCreated} />,
    );
    await fillRequired();

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('updates an existing company by id with the chosen size and status', async () => {
    const { onDone } = renderForm(companyRow({ id: 'company-1', size: '51-200' }));

    expect(screen.getByLabelText('Company name')).toHaveValue('Acme');
    await chooseOption('Size', '201-1000 people');
    await chooseOption('Status', 'Customer');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'company-1',
        input: expect.objectContaining({
          name: 'Acme',
          domain: 'acme.io',
          size: '201-1000',
          status: CompanyStatus.Customer,
        }),
      },
    });
    expect(await screen.findByText('Company updated')).toBeInTheDocument();
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce('conflict');
    const { onDone } = renderForm(companyRow());

    await press('Update');

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
