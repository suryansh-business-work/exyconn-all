import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { IncidentUpdateStatus } from '@exyconn/shell/graphql/generated';
import {
  IncidentUpdateForm,
  incidentUpdateSchema,
  type UpdatedIncident,
} from '../../../../../../src/pages/incidents/forms/incident-update';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fill,
  formCallbacks,
  pickOption,
  press,
} from '../../../environment-variables/forms/form.helpers';

const gql = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAddStatusIncidentUpdateMutation: () => [gql.add],
}));

const cb = formCallbacks();
const STATUS = /^Status/;
const RESOLVE_WARNING = 'Resolving closes the incident and alerts Slack and the Tech team.';
const open: UpdatedIncident = { id: 'inc-1', title: 'Portal API is slow' };

const renderForm = (incident: UpdatedIncident = open) =>
  renderWithProviders(
    <IncidentUpdateForm incident={incident} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('IncidentUpdateForm', () => {
  beforeEach(() => {
    gql.add.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('shows a closed timeline instead of a form once the incident is resolved', () => {
    renderForm({ ...open, resolvedAt: '2026-10-01T10:00:00.000Z' });
    expect(
      screen.getByText('This incident is resolved; its timeline is closed.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Post' })).not.toBeInTheDocument();
  });

  it('names the incident and defaults the update to Identified', () => {
    renderForm();
    expect(screen.getByText('Portal API is slow')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: STATUS })).toHaveTextContent('Identified');
    expect(screen.queryByText(RESOLVE_WARNING)).not.toBeInTheDocument();
  });

  it('wants an update of 10 to 4000 characters', async () => {
    renderForm();
    fill('Update', 'Fixed');
    await press('Post');
    await expectMessages('Say what changed — at least 10 characters');

    fill('Update', 'u'.repeat(4001));
    await press('Post');
    await expectMessages('Keep the update under 4000 characters');
    expect(gql.add).not.toHaveBeenCalled();
  });

  it('posts a progress update to the timeline', async () => {
    renderForm();
    await pickOption(STATUS, 'Monitoring');
    fill('Update', 'A fix is deployed; watching error rates');
    await press('Post');

    await doneOnce(cb.onDone);
    expect(gql.add).toHaveBeenCalledWith({
      variables: {
        id: 'inc-1',
        status: IncidentUpdateStatus.Monitoring,
        body: 'A fix is deployed; watching error rates',
      },
    });
    expect(await screen.findByText('Update posted')).toBeInTheDocument();
  });

  it('warns before resolving, then closes the incident', async () => {
    renderForm();
    await pickOption(STATUS, 'Resolved');
    expect(screen.getByText(RESOLVE_WARNING)).toBeInTheDocument();
    fill('Update', 'Error rates are back to normal');
    await press('Post');

    await doneOnce(cb.onDone);
    expect(gql.add.mock.calls[0][0].variables.status).toBe(IncidentUpdateStatus.Resolved);
    expect(await screen.findByText('Incident resolved')).toBeInTheDocument();
  });

  it('shows why an update could not be posted', async () => {
    gql.add.mockRejectedValue(new Error('The incident was resolved meanwhile'));
    renderForm();
    fill('Update', 'Still looking into it, no ETA');
    await press('Post');
    expect(await screen.findByText('The incident was resolved meanwhile')).toBeInTheDocument();
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message for an unexplained failure', async () => {
    gql.add.mockRejectedValue(undefined);
    renderForm();
    fill('Update', 'Still looking into it, no ETA');
    await press('Post');
    expect(await screen.findByText('Could not post the update')).toBeInTheDocument();
  });

  it('only accepts the statuses the server knows', () => {
    expect(
      incidentUpdateSchema.safeParse({ status: 'FIXED', body: 'All good now, thanks' }).success,
    ).toBe(false);
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
