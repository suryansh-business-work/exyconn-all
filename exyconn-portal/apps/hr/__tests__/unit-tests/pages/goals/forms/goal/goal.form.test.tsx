import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { GoalStatus } from '@exyconn/shell/graphql/generated';
import { GoalForm, type GoalRow } from '../../../../../../src/pages/goals/forms/goal';
import { renderWithProviders } from '../../../../test-utils';
import {
  USERS,
  chooseOption,
  localIso,
  pickDate,
  pickOption,
  press,
  setNumber,
  typeInto,
} from '../../../../harness/forms';

vi.setConfig({ testTimeout: 20_000 });

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), users: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateGoalMutation: () => [gql.create],
  useUpdateGoalMutation: () => [gql.update],
  useListUsersQuery: () => gql.users(),
}));

const row: GoalRow = {
  id: 'goal-8',
  employeeId: 'user-1',
  title: 'Close Q3 hiring',
  description: 'Fill the open sales roles',
  kpi: 'Roles filled',
  weightage: 40,
  startDate: localIso(2026, 6, 1),
  endDate: localIso(2026, 8, 30),
  progress: 60,
  status: GoalStatus.Active,
  managerComment: 'On track',
};

function renderForm(initial: GoalRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<GoalForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('GoalForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({});
    gql.update.mockReset().mockResolvedValue({});
    gql.users.mockReset().mockReturnValue({ data: { listUsers: USERS } });
  });

  it('asks for everything a goal is measured by', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('KPI is required')).toBeInTheDocument();
    expect(screen.getByText('Start date is required')).toBeInTheDocument();
    expect(screen.getByText('End date is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a negative weight or progress', async () => {
    renderForm(row);

    setNumber('Weightage %', '-10');
    setNumber('Progress %', '-1');
    await press('Update');

    expect(await screen.findAllByText('Must be ≥ 0')).toHaveLength(2);
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('creates a goal, sending an empty manager comment as null', async () => {
    const { onDone } = renderForm();

    await pickOption('Employee', 'Bo Chen (bo@example.com)');
    await typeInto('Title', 'Ship payroll v2');
    await typeInto('Description', 'Replace the legacy run');
    await typeInto('KPI', 'Release date');
    setNumber('Weightage %', '30');
    pickDate('startDate', '07/01/2026');
    pickDate('endDate', '09/30/2026');
    setNumber('Progress %', '10');
    await chooseOption('Status', 'Draft');
    await press('Create');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: {
            employeeId: 'user-2',
            title: 'Ship payroll v2',
            description: 'Replace the legacy run',
            kpi: 'Release date',
            weightage: 30,
            startDate: localIso(2026, 6, 1),
            endDate: localIso(2026, 8, 30),
            progress: 10,
            status: GoalStatus.Draft,
            managerComment: null,
          },
        },
      }),
    );
    expect(await screen.findByText('Goal created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('updates an existing goal by id, keeping the manager comment', async () => {
    renderForm(row);

    await press('Update');

    await waitFor(() =>
      expect(gql.update).toHaveBeenCalledWith({
        variables: {
          id: 'goal-8',
          input: {
            employeeId: 'user-1',
            title: 'Close Q3 hiring',
            description: 'Fill the open sales roles',
            kpi: 'Roles filled',
            weightage: 40,
            startDate: row.startDate,
            endDate: row.endDate,
            progress: 60,
            status: GoalStatus.Active,
            managerComment: 'On track',
          },
        },
      }),
    );
    expect(await screen.findByText('Goal updated')).toBeInTheDocument();
  });

  it('says why the save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Weights add up to more than 100%'));
    const { onDone } = renderForm(row);

    await press('Update');

    expect(await screen.findByText('Weights add up to more than 100%')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on cancel', async () => {
    gql.users.mockReturnValue({ data: undefined });
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
