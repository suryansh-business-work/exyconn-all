import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { MilestoneState } from '@exyconn/shell/graphql/generated';
import {
  MilestoneForm,
  type MilestoneRow,
} from '../../../../../../src/pages/projects/forms/milestone';
import { renderWithProviders } from '../../../../test-utils';
import { milestoneRow } from '../../../../fixtures';
import {
  fill,
  localIso,
  optionsOf,
  pickDate,
  pickOption,
  press,
} from '../../../../helpers/form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateMilestoneMutation: () => [gql.create],
  useUpdateMilestoneMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: MilestoneRow | null = null) =>
  renderWithProviders(
    <MilestoneForm projectId="proj-1" initial={initial} onDone={onDone} onCancel={onCancel} />,
  );

describe('MilestoneForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: {} });
    gql.update.mockResolvedValue({ data: {} });
  });

  it('asks for a name, and says the description is for clients', async () => {
    renderForm();
    expect(
      screen.getByText('Shown to clients on a shared link — write it for them'),
    ).toBeInTheDocument();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the name under 80 characters and the description under 300', async () => {
    renderForm();
    fill('Milestone', 'n'.repeat(81));
    fill('Description (optional)', 'd'.repeat(301));

    await press('Create');

    expect(await screen.findByText('Keep the name under 80 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the description under 300 characters')).toBeInTheDocument();
  });

  it('accepts a name of exactly 80 characters', async () => {
    renderForm();
    fill('Milestone', 'n'.repeat(80));

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it('offers every milestone state in words', async () => {
    renderForm();

    expect(await optionsOf(/^State/)).toEqual(['Hit', 'In Progress', 'Missed', 'Planned']);
  });

  it('plans a new milestone on the project, with no date unless one is picked', async () => {
    renderForm();
    fill('Milestone', '  Go live  ');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        projectId: 'proj-1',
        input: { name: 'Go live', description: '', dueOn: null, state: MilestoneState.Planned },
      },
    });
    expect(await screen.findByText('Milestone created')).toBeInTheDocument();
  });

  it('saves a picked due date', async () => {
    renderForm();
    fill('Milestone', 'Beta');
    pickDate('dueOn', '11/15/2026');

    await press('Create');

    await waitFor(() => expect(gql.create).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input.dueOn).toBe(localIso(2026, 10, 15));
  });

  it('updates an existing milestone by id with its new state', async () => {
    renderForm(milestoneRow({ id: 'milestone-4' }));
    expect(screen.getByLabelText('Milestone')).toHaveValue('Go live');

    await pickOption(/^State/, 'Hit');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'milestone-4',
        input: {
          name: 'Go live',
          description: 'Public launch',
          dueOn: '2026-11-01T00:00:00.000Z',
          state: MilestoneState.Hit,
        },
      },
    });
    expect(await screen.findByText('Milestone updated')).toBeInTheDocument();
  });

  it('keeps an undated milestone undated when it is saved', async () => {
    renderForm(milestoneRow({ dueOn: null }));

    await press('Update');

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input.dueOn).toBeNull();
  });

  it('keeps the form open and says why a save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Milestone is closed'));
    renderForm(milestoneRow());

    await press('Update');

    expect(await screen.findByText('Milestone is closed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
