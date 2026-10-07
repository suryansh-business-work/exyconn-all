import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { CampaignChannel, CampaignStatus } from '@exyconn/shell/graphql/generated';
import {
  CampaignForm,
  type CampaignRow,
} from '../../../../../../src/pages/marketing/forms/campaign';
import { renderWithProviders } from '../../../../test-utils';
import { campaignRow } from '../../../../fixtures';
import { chooseOption, fill, optionsOf, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), audiences: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCampaignMutation: () => [gql.create],
  useUpdateCampaignMutation: () => [gql.update],
  useListAudienceListsQuery: () => gql.audiences(),
}));

/** The MUI X pickers become plain inputs holding the ISO string the real ones store. */
vi.mock('@exyconn/shell/components/form/rhf', async (importOriginal) => {
  const stubs = await import('../../../../rhf-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/form/rhf')>()),
    RhfDatePicker: stubs.RhfValueStub,
    RhfDateTimePicker: stubs.RhfValueStub,
  };
});

const START = '2026-10-01T00:00:00.000Z';
const END = '2026-10-31T00:00:00.000Z';
const SEND_AT = '2026-10-05T04:30:00.000Z';

function renderForm(initial: CampaignRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<CampaignForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

function fillRequired() {
  fill('Name', 'Diwali offer');
  fill('Start date', START);
  fill('End date', END);
}

describe('CampaignForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createCampaign: { id: 'campaign-9' } } });
    gql.update.mockResolvedValue({ data: { updateCampaign: { id: 'campaign-1' } } });
    gql.audiences.mockReturnValue({
      data: { listAudienceLists: [{ id: 'audience-1', name: 'Newsletter' }] },
    });
  });

  it('requires a name and both dates', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Start date is required')).toBeInTheDocument();
    expect(screen.getByText('End date is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a negative budget and an over-long subject', async () => {
    renderForm();
    fillRequired();
    fill('Budget', '-5');
    fill('Email subject', 'x'.repeat(151));

    await press('Create');

    expect(await screen.findByText('Must be ≥ 0')).toBeInTheDocument();
    expect(screen.getByText('Keep the subject under 150 characters')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('needs an audience for a scheduled send', async () => {
    renderForm();
    fillRequired();
    fill('Send automatically at', SEND_AT);

    await press('Create');

    expect(await screen.findByText('A scheduled send needs an audience')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers the saved audiences for a scheduled send', async () => {
    renderForm();

    expect(await optionsOf('Scheduled audience')).toEqual(['Newsletter']);
  });

  it('creates a hand-sent campaign with no schedule on the wire', async () => {
    const { onDone } = renderForm();
    fillRequired();
    fill('Budget', '50000');
    await chooseOption('Channel', 'Social');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Diwali offer',
          channel: CampaignChannel.Social,
          budget: 50000,
          startDate: START,
          endDate: END,
          status: CampaignStatus.Planned,
          subject: '',
          body: '',
          templateKey: '',
          scheduledAt: null,
          scheduledAudienceListId: '',
        },
      },
    });
    expect(await screen.findByText('Campaign created')).toBeInTheDocument();
  });

  it('schedules a campaign to an audience', async () => {
    const { onDone } = renderForm();
    fillRequired();
    fill('Send automatically at', SEND_AT);
    await chooseOption('Scheduled audience', 'Newsletter');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input).toMatchObject({
      scheduledAt: SEND_AT,
      scheduledAudienceListId: 'audience-1',
    });
  });

  it('updates an existing campaign by id, keeping its values', async () => {
    const row = campaignRow({ id: 'campaign-1', templateKey: null, subject: null, body: null });
    const { onDone } = renderForm(row);

    expect(screen.getByLabelText('Name')).toHaveValue('Diwali offer');
    await chooseOption('Status', 'Paused');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'campaign-1',
        input: expect.objectContaining({
          name: 'Diwali offer',
          budget: 120000,
          status: CampaignStatus.Paused,
          subject: '',
          scheduledAt: null,
        }),
      },
    });
    expect(await screen.findByText('Campaign updated')).toBeInTheDocument();
  });

  it('says to create an audience first when there is none', () => {
    gql.audiences.mockReturnValue({ data: undefined });
    renderForm();

    expect(screen.getByText('No audiences yet — create one first.')).toBeInTheDocument();
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce(new Error('Campaign is locked'));
    const { onDone } = renderForm(campaignRow());

    await press('Update');

    expect(await screen.findByText('Campaign is locked')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
