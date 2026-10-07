import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { DealStage } from '@exyconn/shell/graphql/generated';
import { DealForm } from '../../../../../../src/pages/deals/forms/deal';
import { renderWithProviders } from '../../../../test-utils';
import { companyRow, contactRow, dealRow } from '../../../../fixtures';
import { chooseOption, fillField, optionsOf, press, setNumber } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  companies: vi.fn(),
  contacts: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateDealMutation: () => [gql.create],
  useUpdateDealMutation: () => [gql.update],
  useListCompaniesQuery: () => gql.companies(),
  useListContactsQuery: () => gql.contacts(),
}));

const COMPANIES = [companyRow(), companyRow({ id: 'company-2', name: 'Globex' })];
const CONTACTS = [
  contactRow(),
  contactRow({ id: 'contact-2', name: 'Lone Freelancer', companyId: '', companyName: '' }),
];

function renderForm(initial: ReturnType<typeof dealRow> | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<DealForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('DealForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createDeal: { id: 'deal-9' } } });
    gql.update.mockResolvedValue({ data: { updateDeal: { id: 'deal-1' } } });
    gql.companies.mockReturnValue({ data: { listCompanies: COMPANIES } });
    gql.contacts.mockReturnValue({ data: { listContacts: CONTACTS } });
  });

  it('requires a title and an owner', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Owner is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the value positive and the probability a percent', async () => {
    renderForm();
    await fillField('Deal', 'Globex renewal');
    await fillField('Owner', 'Priya');
    setNumber('Value', '-100');
    setNumber('Probability', '120');

    await press('Create');

    expect(await screen.findByText('Value cannot be negative')).toBeInTheDocument();
    expect(screen.getByText('Probability is a percent, 0-100')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a negative probability too', async () => {
    renderForm();
    setNumber('Probability', '-1');

    await press('Create');

    expect(await screen.findByText('Probability is a percent, 0-100')).toBeInTheDocument();
  });

  it('labels each contact with their company when they have one', async () => {
    renderForm();

    expect(await optionsOf('Contact')).toEqual(['Asha Rao — Acme', 'Lone Freelancer']);
  });

  it('creates a qualifying deal, carrying the company and contact names', async () => {
    const { onDone } = renderForm();
    await fillField('Deal', 'Globex renewal');
    await fillField('Owner', 'Priya');
    setNumber('Value', '250000');
    await chooseOption('Company', 'Globex');
    await chooseOption('Contact', 'Lone Freelancer');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Globex renewal',
          companyId: 'company-2',
          companyName: 'Globex',
          contactId: 'contact-2',
          contactName: 'Lone Freelancer',
          stage: DealStage.Qualifying,
          value: 250000,
          probability: 10,
          expectedCloseDate: null,
          owner: 'Priya',
          notes: '',
        },
      },
    });
    expect(await screen.findByText('Deal created')).toBeInTheDocument();
  });

  it('saves without names while the companies and contacts have not loaded', async () => {
    gql.companies.mockReturnValue({ data: undefined });
    gql.contacts.mockReturnValue({ data: undefined });
    renderForm(dealRow({ id: 'deal-1' }));

    await press('Update');

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input).toMatchObject({
      companyId: 'company-1',
      companyName: '',
      contactId: 'contact-1',
      contactName: '',
    });
  });

  it('updates a deal by id, keeping its expected close date', async () => {
    const closing = '2026-12-15T00:00:00.000Z';
    const row = dealRow({ id: 'deal-1', expectedCloseDate: closing, probability: 40 });
    const { onDone } = renderForm(row);

    expect(screen.getByLabelText('Deal')).toHaveValue('Acme rollout');
    await chooseOption('Stage', 'Negotiation');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'deal-1',
        input: expect.objectContaining({
          title: 'Acme rollout',
          stage: DealStage.Negotiation,
          probability: 40,
          expectedCloseDate: closing,
          companyName: 'Acme',
          contactName: 'Asha Rao',
        }),
      },
    });
    expect(await screen.findByText('Deal updated')).toBeInTheDocument();
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce(new Error('Deal is closed'));
    const { onDone } = renderForm(dealRow());

    await press('Update');

    expect(await screen.findByText('Deal is closed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
