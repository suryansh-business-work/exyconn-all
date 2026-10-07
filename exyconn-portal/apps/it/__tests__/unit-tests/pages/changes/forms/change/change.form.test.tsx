import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  ItChangeStatus,
  ItChangeType,
  ItEnvironment,
  ItRisk,
} from '@exyconn/shell/graphql/generated';
import { ChangeForm, type ChangeRow } from '../../../../../../src/pages/changes/forms/change';
import { changeRow } from '../../../../core/rows.fixtures';
import { fill, optionsOf, press, toast } from '../../../../core/form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateItChangeMutation: () => [gql.create],
  useUpdateItChangeMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ChangeRow | null = null) =>
  renderWithProviders(<ChangeForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('ChangeForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks for a title, a description and the system being changed', async () => {
    renderForm();
    await press('Create');
    expect(await screen.findByText('Give the change a title')).toBeInTheDocument();
    expect(screen.getByText('Describe what will change')).toBeInTheDocument();
    expect(screen.getByText('Name the system being changed')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('drafts a normal, medium-risk production change with a window that ends after it starts', async () => {
    renderForm();
    fill('Title', 'Upgrade Mongo');
    fill('System', 'Database');
    fill('What will change', 'Minor version bump on the primary');
    fill('Owner', 'Meera');
    fill('Rollback plan', 'Restore the snapshot');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    const { input } = gql.create.mock.calls[0][0].variables;
    expect(input).toMatchObject({
      title: 'Upgrade Mongo',
      system: 'Database',
      description: 'Minor version bump on the primary',
      type: ItChangeType.Normal,
      risk: ItRisk.Medium,
      environment: ItEnvironment.Production,
      status: ItChangeStatus.Draft,
      ownerName: 'Meera',
      rollbackPlan: 'Restore the snapshot',
    });
    expect(new Date(input.plannedEnd).getTime()).toBeGreaterThan(
      new Date(input.plannedStart).getTime(),
    );
    expect(await toast()).toHaveTextContent('Change created');
  });

  it('never offers approval or rejection on a new change', async () => {
    renderForm();
    expect(await optionsOf(/^Status/)).toEqual([
      'Draft',
      'Failed',
      'Implemented',
      'Pending Approval',
      'Rolled Back',
      'Scheduled',
    ]);
  });

  it('keeps a decided change as decided without offering the other decision', async () => {
    renderForm(changeRow({ status: ItChangeStatus.Approved }));
    const offered = await optionsOf(/^Status/);
    expect(offered).toContain('Approved');
    expect(offered).not.toContain('Rejected');
  });

  it('saves an edit onto the change', async () => {
    renderForm(changeRow());
    expect(screen.getByLabelText('Title')).toHaveValue('Upgrade Mongo');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'chg-1',
        input: expect.objectContaining({
          title: 'Upgrade Mongo',
          status: ItChangeStatus.PendingApproval,
          plannedStart: '2026-10-10T10:00:00.000Z',
          plannedEnd: '2026-10-10T11:00:00.000Z',
        }),
      },
    });
    expect(await toast()).toHaveTextContent('Change updated');
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('Change is already implemented'));
    renderForm(changeRow());
    await press('Update');
    expect(await toast()).toHaveTextContent('Change is already implemented');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
