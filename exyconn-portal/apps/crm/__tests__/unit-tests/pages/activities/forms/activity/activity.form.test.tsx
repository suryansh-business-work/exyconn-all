import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ActivitySubject, ActivityType } from '@exyconn/shell/graphql/generated';
import { ActivityForm } from '../../../../../../src/pages/activities/forms/activity';
import { renderWithProviders } from '../../../../test-utils';
import { activityRow, companyRow, contactRow, dealRow } from '../../../../fixtures';
import { chooseOption, fillField, optionsOf, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  deals: vi.fn(),
  contacts: vi.fn(),
  companies: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateActivityMutation: () => [gql.create],
  useUpdateActivityMutation: () => [gql.update],
  useListDealsQuery: () => gql.deals(),
  useListContactsQuery: () => gql.contacts(),
  useListCompaniesQuery: () => gql.companies(),
}));

function renderForm(initial: ReturnType<typeof activityRow> | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<ActivityForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('ActivityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createActivity: { id: 'activity-9' } } });
    gql.update.mockResolvedValue({ data: { updateActivity: { id: 'activity-1' } } });
    gql.deals.mockReturnValue({ data: { listDeals: [dealRow()] } });
    gql.contacts.mockReturnValue({ data: { listContacts: [contactRow()] } });
    gql.companies.mockReturnValue({
      data: { listCompanies: [companyRow(), companyRow({ id: 'company-2', name: 'Globex' })] },
    });
  });

  it('requires a subject, what it is about and an owner', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByText('Choose what this is about')).toBeInTheDocument();
    expect(screen.getByText('Owner is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('offers the records of the kind the activity is about', async () => {
    renderForm();

    expect(await optionsOf('Related to')).toEqual(['Acme rollout']);
    await chooseOption('About', 'Contact');
    expect(await optionsOf('Related to')).toEqual(['Asha Rao']);
    await chooseOption('About', 'Company');
    expect(await optionsOf('Related to')).toEqual(['Acme', 'Globex']);
  });

  it('offers nothing to relate to while the lists have not loaded', async () => {
    gql.deals.mockReturnValue({ data: undefined });
    gql.contacts.mockReturnValue({ data: undefined });
    gql.companies.mockReturnValue({ data: undefined });
    renderForm();

    expect(await optionsOf('Related to')).toEqual([]);
    await chooseOption('About', 'Contact');
    expect(await optionsOf('Related to')).toEqual([]);
    await chooseOption('About', 'Company');
    expect(await optionsOf('Related to')).toEqual([]);
  });

  it('logs an outstanding note about a deal, naming the deal', async () => {
    const { onDone } = renderForm();
    await fillField('Subject', 'Sent the proposal');
    await chooseOption('Related to', 'Acme rollout');
    await fillField('Owner', 'Priya');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          type: ActivityType.Note,
          subject: 'Sent the proposal',
          notes: '',
          relatedType: ActivitySubject.Deal,
          relatedId: 'deal-1',
          relatedName: 'Acme rollout',
          dueDate: null,
          done: false,
          owner: 'Priya',
        },
      },
    });
    expect(await screen.findByText('Activity created')).toBeInTheDocument();
  });

  it('schedules a meeting with a company and marks it done', async () => {
    renderForm();
    await fillField('Subject', 'Quarterly review');
    await chooseOption('Type', 'Meeting');
    await chooseOption('About', 'Company');
    await chooseOption('Related to', 'Globex');
    await chooseOption('Status', 'Done');
    await fillField('Owner', 'Priya');

    await press('Create');

    await waitFor(() => expect(gql.create).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input).toMatchObject({
      type: ActivityType.Meeting,
      relatedType: ActivitySubject.Company,
      relatedId: 'company-2',
      relatedName: 'Globex',
      done: true,
    });
  });

  it('updates an activity by id, keeping its due date and done state', async () => {
    const due = '2026-11-02T00:00:00.000Z';
    const row = activityRow({ id: 'activity-1', dueDate: due, done: true });
    const { onDone } = renderForm(row);

    expect(screen.getByLabelText('Subject')).toHaveValue('Kick-off call');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'activity-1',
        input: expect.objectContaining({
          type: ActivityType.Call,
          relatedId: 'deal-1',
          relatedName: 'Acme rollout',
          dueDate: due,
          done: true,
        }),
      },
    });
    expect(await screen.findByText('Activity updated')).toBeInTheDocument();
  });

  it('names nothing when the related record is no longer in the list', async () => {
    gql.deals.mockReturnValue({ data: { listDeals: [] } });
    renderForm(activityRow({ relatedId: 'deal-gone' }));

    await press('Update');

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input).toMatchObject({
      relatedId: 'deal-gone',
      relatedName: '',
    });
  });

  it('keeps the form open and reports a failed save', async () => {
    gql.update.mockRejectedValueOnce(new Error('Activity was deleted'));
    const { onDone } = renderForm(activityRow());

    await press('Update');

    expect(await screen.findByText('Activity was deleted')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
