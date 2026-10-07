import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SprintForm, type SprintRow } from '../../../../../../src/pages/projects/forms/sprint';
import { renderWithProviders } from '../../../../test-utils';
import { sprintRow } from '../../../../fixtures';
import { fill, localIso, pickDate, press } from '../../../../helpers/form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateSprintMutation: () => [gql.create],
  useUpdateSprintMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: SprintRow | null = null) =>
  renderWithProviders(
    <SprintForm projectId="proj-1" initial={initial} onDone={onDone} onCancel={onCancel} />,
  );

describe('SprintForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: {} });
    gql.update.mockResolvedValue({ data: {} });
  });

  it('asks for a sprint name', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the name under 60 characters and the goal under 200', async () => {
    renderForm();
    fill('Sprint name', 's'.repeat(61));
    fill('Goal (optional)', 'g'.repeat(201));

    await press('Create');

    expect(await screen.findByText('Keep the name under 60 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the goal under 200 characters')).toBeInTheDocument();
  });

  it('will not let a sprint end before it starts', async () => {
    renderForm();
    fill('Sprint name', 'Sprint 13');
    pickDate('startsOn', '10/15/2026');
    pickDate('endsOn', '10/14/2026');

    await press('Create');

    expect(await screen.findByText('The sprint cannot end before it starts')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('plans a sprint on the project, undated unless dates are picked', async () => {
    renderForm();
    fill('Sprint name', '  Sprint 13  ');
    fill('Goal (optional)', ' Ship billing ');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        projectId: 'proj-1',
        input: { name: 'Sprint 13', goal: 'Ship billing', startsOn: null, endsOn: null },
      },
    });
    expect(await screen.findByText('Sprint created')).toBeInTheDocument();
  });

  it('lets a one-day sprint start and end on the same day', async () => {
    renderForm();
    fill('Sprint name', 'Hack day');
    pickDate('startsOn', '10/15/2026');
    pickDate('endsOn', '10/15/2026');

    await press('Create');

    await waitFor(() => expect(gql.create).toHaveBeenCalledTimes(1));
    expect(gql.create.mock.calls[0][0].variables.input).toEqual({
      name: 'Hack day',
      goal: '',
      startsOn: localIso(2026, 9, 15),
      endsOn: localIso(2026, 9, 15),
    });
  });

  it('re-plans an existing sprint by id, keeping its dates', async () => {
    renderForm(sprintRow({ id: 'sprint-7' }));
    expect(screen.getByLabelText('Sprint name')).toHaveValue('Sprint 12');
    fill('Sprint name', 'Sprint 12b');

    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'sprint-7',
        input: {
          name: 'Sprint 12b',
          goal: 'Ship sign-in',
          startsOn: '2026-10-01T00:00:00.000Z',
          endsOn: '2026-10-14T00:00:00.000Z',
        },
      },
    });
    expect(await screen.findByText('Sprint updated')).toBeInTheDocument();
  });

  it('keeps an undated sprint undated', async () => {
    renderForm(sprintRow({ startsOn: null, endsOn: null }));

    await press('Update');

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input).toEqual(
      expect.objectContaining({ startsOn: null, endsOn: null }),
    );
  });

  it('keeps the form open and says why a save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Sprint is complete'));
    renderForm(sprintRow());

    await press('Update');

    expect(await screen.findByText('Sprint is complete')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
