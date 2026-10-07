import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadSource, LeadStage } from '@exyconn/shell/graphql/generated';
import { LeadForm } from '../../../../../../src/pages/crm/forms/lead';
import { renderWithProviders } from '../../../../test-utils';
import { leadRow } from '../../../../fixtures';
import { chooseOption, fillField, press, setNumber } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), campaigns: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateLeadMutation: () => [gql.create],
  useUpdateLeadMutation: () => [gql.update],
  useCampaignOptionsQuery: () => gql.campaigns(),
}));

const CAMPAIGNS = [
  { __typename: 'CampaignOption' as const, id: 'campaign-1', name: 'Diwali offer' },
  { __typename: 'CampaignOption' as const, id: 'campaign-2', name: 'Trade fair' },
];

function renderForm(initial: ReturnType<typeof leadRow> | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<LeadForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('LeadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createLead: { id: 'lead-9' } } });
    gql.update.mockResolvedValue({ data: { updateLead: { id: 'lead-1' } } });
    gql.campaigns.mockReturnValue({ data: { campaignOptions: CAMPAIGNS } });
  });

  it('requires a name, an email and an owner', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Owner is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a malformed email and a negative value', async () => {
    renderForm();
    await fillField('Name', 'Kiran Shah');
    await fillField('Email', 'kiran@');
    await fillField('Owner', 'Priya');
    setNumber('Value', '-5');

    await press('Create');

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Must be ≥ 0')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a new website lead, tied to the campaign it came from', async () => {
    const { onDone } = renderForm();
    await fillField('Name', 'Kiran Shah');
    await fillField('Email', 'kiran@initech.com');
    await fillField('Owner', 'Priya');
    setNumber('Value', '40000');
    await userEvent.type(screen.getByRole('combobox', { name: 'Campaign' }), 'Trade');
    await userEvent.click(await screen.findByRole('option', { name: 'Trade fair' }));

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Kiran Shah',
          email: 'kiran@initech.com',
          source: LeadSource.Website,
          stage: LeadStage.New,
          value: 40000,
          owner: 'Priya',
          campaignId: 'campaign-2',
        },
      },
    });
    expect(await screen.findByText('Lead created')).toBeInTheDocument();
  });

  it('offers no campaigns until they have loaded, and saves without one', async () => {
    gql.campaigns.mockReturnValue({ data: undefined });
    renderForm();
    await fillField('Name', 'Kiran Shah');
    await fillField('Email', 'kiran@initech.com');
    await fillField('Owner', 'Priya');

    await userEvent.click(screen.getByRole('combobox', { name: 'Campaign' }));
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    await press('Create');

    await waitFor(() => expect(gql.create).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input).toMatchObject({ campaignId: '', value: 0 });
  });

  it('updates an existing lead by id with its new stage and source', async () => {
    const row = leadRow({ id: 'lead-1', campaignId: 'campaign-1' });
    const { onDone } = renderForm(row);

    expect(screen.getByRole('combobox', { name: 'Campaign' })).toHaveValue('Diwali offer');
    await chooseOption('Source', 'Event');
    await chooseOption('Stage', 'Won');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'lead-1',
        input: {
          name: 'Asha Rao',
          email: 'asha@acme.io',
          source: LeadSource.Event,
          stage: LeadStage.Won,
          value: 25000,
          owner: 'Priya',
          campaignId: 'campaign-1',
        },
      },
    });
    expect(await screen.findByText('Lead updated')).toBeInTheDocument();
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce(new Error('Lead was deleted'));
    const { onDone } = renderForm(leadRow());

    await press('Update');

    expect(await screen.findByText('Lead was deleted')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
