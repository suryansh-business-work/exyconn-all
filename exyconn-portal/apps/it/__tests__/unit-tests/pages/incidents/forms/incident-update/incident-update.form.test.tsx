import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ItIncidentStatus } from '@exyconn/shell/graphql/generated';
import {
  IncidentUpdateForm,
  incidentUpdateSchema,
} from '../../../../../../src/pages/incidents/forms/incident-update';
import { fill, pickOption, press, toast } from '../../../../core/form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ addUpdate: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useAddItIncidentUpdateMutation: () => [gql.addUpdate],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = () =>
  renderWithProviders(
    <IncidentUpdateForm
      incidentId="inc-1"
      status={ItIncidentStatus.Identified}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );

describe('IncidentUpdateForm', () => {
  beforeEach(() => {
    gql.addUpdate.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks what happened before posting', async () => {
    renderForm();
    await press('Post update');
    expect(await screen.findByText('Say what happened')).toBeInTheDocument();
    expect(gql.addUpdate).not.toHaveBeenCalled();
  });

  it('posts the new status and note, then clears the note for the next one', async () => {
    renderForm();
    await pickOption(/^Status/, 'Monitoring');
    fill('What happened', 'Fix deployed, watching error rates');
    await press('Post update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.addUpdate).toHaveBeenCalledWith({
      variables: {
        id: 'inc-1',
        status: ItIncidentStatus.Monitoring,
        note: 'Fix deployed, watching error rates',
      },
    });
    expect(screen.getByLabelText('What happened')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveTextContent('Monitoring');
    expect(await toast()).toHaveTextContent('Update posted');
  });

  it('keeps the note and shows why when posting fails', async () => {
    gql.addUpdate.mockRejectedValue(new Error('Incident is closed'));
    renderForm();
    fill('What happened', 'Still down');
    await press('Post update');
    expect(await toast()).toHaveTextContent('Incident is closed');
    expect(screen.getByLabelText('What happened')).toHaveValue('Still down');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.addUpdate.mockRejectedValue('offline');
    renderForm();
    fill('What happened', 'Still down');
    await press('Post update');
    expect(await toast()).toHaveTextContent('Could not post the update');
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('incidentUpdateSchema', () => {
  it('caps the note at 2000 characters', () => {
    const result = incidentUpdateSchema.safeParse({
      status: ItIncidentStatus.Resolved,
      note: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Too long');
  });
});
