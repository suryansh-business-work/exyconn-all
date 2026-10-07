import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { TrainingStatus } from '@exyconn/shell/graphql/generated';
import {
  TrainingForm,
  type TrainingRow,
} from '../../../../../../src/pages/training/forms/training';
import { renderWithProviders } from '../../../../test-utils';
import {
  USERS,
  chooseOption,
  localIso,
  pickDate,
  pickOption,
  press,
  typeInto,
} from '../../../../harness/forms';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), users: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateTrainingMutation: () => [gql.create],
  useUpdateTrainingMutation: () => [gql.update],
  useListUsersQuery: () => gql.users(),
}));

const ROW: TrainingRow = {
  id: 'training-2',
  employeeId: 'user-2',
  title: 'First aid',
  provider: 'Red Cross',
  category: 'Safety',
  assignedOn: '2026-09-01T00:00:00.000Z',
  dueOn: '2026-10-01T00:00:00.000Z',
  completedOn: null,
  status: TrainingStatus.InProgress,
  certificateUrl: null,
};

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: TrainingRow | null = null) =>
  renderWithProviders(<TrainingForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('TrainingForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.users.mockReset().mockReturnValue({ data: { listUsers: USERS } });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('assigns a course, not yet started, with the unset dates and link sent as null', async () => {
    renderForm();
    await pickOption('Employee', 'Asha Rao (asha@example.com)');
    await typeInto('Course', ' Fire safety ');
    await typeInto('Provider', 'SafeCo');
    await typeInto('Category', 'Compliance');
    pickDate('assignedOn', '10/06/2026');
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          employeeId: 'user-1',
          title: 'Fire safety',
          provider: 'SafeCo',
          category: 'Compliance',
          assignedOn: localIso(2026, 9, 6),
          dueOn: null,
          completedOn: null,
          status: TrainingStatus.Assigned,
          certificateUrl: null,
        },
      },
    });
    expect(await screen.findByText('Training created')).toBeInTheDocument();
  });

  it('records a completed course with its date and certificate link', async () => {
    renderForm(ROW);
    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue(
      'Bo Chen (bo@example.com)',
    );
    await chooseOption('Status', 'Completed');
    pickDate('completedOn', '10/05/2026');
    await typeInto('Certificate link', 'https://certs.example.com/aid/42');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'training-2',
        input: {
          employeeId: 'user-2',
          title: 'First aid',
          provider: 'Red Cross',
          category: 'Safety',
          assignedOn: '2026-09-01T00:00:00.000Z',
          dueOn: '2026-10-01T00:00:00.000Z',
          completedOn: localIso(2026, 9, 5),
          status: TrainingStatus.Completed,
          certificateUrl: 'https://certs.example.com/aid/42',
        },
      },
    });
    expect(await screen.findByText('Training updated')).toBeInTheDocument();
  });

  it('asks for the employee, course, provider, category and assigned date', async () => {
    renderForm();
    await press('Create');

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Course is required')).toBeInTheDocument();
    expect(screen.getByText('Provider is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Assigned on is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants a full web address for the certificate', async () => {
    renderForm(ROW);
    await typeInto('Certificate link', 'certs.example.com');
    await press('Update');

    expect(await screen.findByText('Enter a full URL starting with https://')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('offers no employees while the people list has not loaded', () => {
    gql.users.mockReturnValue({ data: undefined });
    renderForm(ROW);

    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue('');
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('Training is archived'));
    renderForm(ROW);
    await press('Update');

    expect(await screen.findByText('Training is archived')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
