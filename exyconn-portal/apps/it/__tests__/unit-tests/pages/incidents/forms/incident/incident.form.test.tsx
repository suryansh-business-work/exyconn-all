import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ItIncidentCategory,
  ItIncidentSeverity,
  ItIncidentStatus,
} from '@exyconn/shell/graphql/generated';
import {
  IncidentForm,
  type IncidentRow,
} from '../../../../../../src/pages/incidents/forms/incident';
import { incidentRow } from '../../../../core/rows.fixtures';
import { fill, pickOption, press, toast } from '../../../../core/form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateItIncidentMutation: () => [gql.create],
  useUpdateItIncidentMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: IncidentRow | null = null) =>
  renderWithProviders(<IncidentForm initial={initial} onDone={onDone} onCancel={onCancel} />);

function fillBasics() {
  fill('Title', 'Mail delivery delayed');
  fill('What is happening', 'Outbound mail is queueing for an hour');
}

describe('IncidentForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks for a title and a description', async () => {
    renderForm();
    await press('Create');
    expect(await screen.findByText('Give the incident a title')).toBeInTheDocument();
    expect(screen.getByText('Describe what is happening')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('records a new SEV3 outage under investigation with no actions yet', async () => {
    renderForm();
    fillBasics();
    fill('Incident commander', 'Meera');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          title: 'Mail delivery delayed',
          description: 'Outbound mail is queueing for an hour',
          severity: ItIncidentSeverity.Sev3,
          category: ItIncidentCategory.Outage,
          status: ItIncidentStatus.Investigating,
          commanderName: 'Meera',
          affectedSystems: [],
          followUps: [],
        }),
      },
    });
    expect(await toast()).toHaveTextContent('Incident created');
  });

  it('adds a post-incident action, sending it undated, and removes one', async () => {
    renderForm();
    fillBasics();
    expect(screen.getByText('Post-incident actions')).toBeInTheDocument();
    await press('Add action');
    await press('Add action');
    expect(screen.getAllByLabelText('Action')).toHaveLength(2);
    await userEvent.click(screen.getAllByRole('button', { name: 'Remove action' })[0]);
    expect(screen.getAllByLabelText('Action')).toHaveLength(1);

    fill('Action', 'Add a queue-depth alert');
    await press('Create');
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input.followUps).toEqual([
      { title: 'Add a queue-depth alert', ownerName: '', dueAt: null, done: false },
    ]);
  });

  it('will not save an action without saying what has to be done', async () => {
    renderForm();
    fillBasics();
    await press('Add action');
    await press('Create');
    expect(await screen.findByText('Say what has to be done')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('will not resolve an incident without its root cause', async () => {
    renderForm();
    fillBasics();
    await pickOption(/^Status/, 'Resolved');
    await press('Create');
    expect(
      await screen.findByText('A resolved incident needs its root cause written down'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('saves an edit with its existing actions', async () => {
    renderForm(incidentRow({ status: ItIncidentStatus.Resolved, rootCause: 'Expired cert' }));
    expect(screen.getAllByLabelText('Action')).toHaveLength(2);
    expect(screen.getByLabelText('Root cause (RCA)')).toHaveValue('Expired cert');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'inc-1',
        input: expect.objectContaining({
          rootCause: 'Expired cert',
          affectedSystems: ['VPN', 'Firewall'],
          followUps: [
            { title: 'Renew certificate', ownerName: 'Ravi', dueAt: null, done: false },
            {
              title: 'Add monitoring',
              ownerName: '',
              dueAt: '2026-11-01T00:00:00.000Z',
              done: true,
            },
          ],
        }),
      },
    });
    expect(await toast()).toHaveTextContent('Incident updated');
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('Incident is locked for review'));
    renderForm(incidentRow());
    await press('Update');
    expect(await toast()).toHaveTextContent('Incident is locked for review');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
