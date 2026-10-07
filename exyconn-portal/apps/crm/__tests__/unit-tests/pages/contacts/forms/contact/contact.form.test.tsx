import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ContactStatus } from '@exyconn/shell/graphql/generated';
import { ContactForm } from '../../../../../../src/pages/contacts/forms/contact';
import { renderWithProviders } from '../../../../test-utils';
import { companyRow, contactRow } from '../../../../fixtures';
import { chooseOption, fillField, optionsOf, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  companies: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateContactMutation: () => [gql.create],
  useUpdateContactMutation: () => [gql.update],
  useListCompaniesQuery: () => gql.companies(),
}));

const COMPANIES = [companyRow(), companyRow({ id: 'company-2', name: 'Globex' })];

function renderForm(initial: ReturnType<typeof contactRow> | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<ContactForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

async function fillRequired() {
  await fillField('Full name', 'Ravi Menon');
  await fillField('Email', 'ravi@globex.com');
  await fillField('Owner', 'Priya');
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createContact: { id: 'contact-9' } } });
    gql.update.mockResolvedValue({ data: { updateContact: { id: 'contact-1' } } });
    gql.companies.mockReturnValue({ data: { listCompanies: COMPANIES } });
  });

  it('requires a name, an email and an owner', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Owner is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a malformed email and phone number', async () => {
    renderForm();
    await fillRequired();
    await fillField('Email', 'ravi.globex');
    await fillField('Phone', 'call me');

    await press('Create');

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers the accounts as companies', async () => {
    renderForm();

    expect(await optionsOf('Company')).toEqual(['Acme', 'Globex']);
  });

  it('creates a contact, storing the chosen company name beside its id', async () => {
    const { onDone } = renderForm();
    await fillRequired();
    await fillField('Phone', '+91 98765 43210');
    await chooseOption('Company', 'Globex');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Ravi Menon',
          email: 'ravi@globex.com',
          phone: '+91 98765 43210',
          title: '',
          companyId: 'company-2',
          companyName: 'Globex',
          status: ContactStatus.Active,
          owner: 'Priya',
          notes: '',
        },
      },
    });
    expect(await screen.findByText('Contact created')).toBeInTheDocument();
  });

  it('stores no company name when no company is chosen or the list has not loaded', async () => {
    gql.companies.mockReturnValue({ data: undefined });
    renderForm();
    await fillRequired();

    await press('Create');

    await waitFor(() => expect(gql.create).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input).toMatchObject({
      companyId: '',
      companyName: '',
    });
  });

  it('updates an existing contact by id, keeping its values', async () => {
    const row = contactRow({ id: 'contact-1', status: ContactStatus.Bounced });
    const { onDone } = renderForm(row);

    expect(screen.getByLabelText('Full name')).toHaveValue('Asha Rao');
    await chooseOption('Status', 'Unsubscribed');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'contact-1',
        input: expect.objectContaining({
          name: 'Asha Rao',
          companyId: 'company-1',
          companyName: 'Acme',
          status: ContactStatus.Unsubscribed,
        }),
      },
    });
    expect(await screen.findByText('Contact updated')).toBeInTheDocument();
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.create.mockRejectedValueOnce(new Error('A contact with this email exists'));
    const { onDone } = renderForm();
    await fillRequired();

    await press('Create');

    expect(await screen.findByText('A contact with this email exists')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
