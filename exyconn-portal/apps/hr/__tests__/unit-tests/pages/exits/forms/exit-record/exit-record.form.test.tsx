import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExitStage } from '@exyconn/shell/graphql/generated';
import {
  ExitRecordForm,
  type ExitRecordRow,
} from '../../../../../../src/pages/exits/forms/exit-record';
import { renderWithProviders } from '../../../../test-utils';
import {
  USERS,
  chooseOption,
  localIso,
  pickDate,
  pickOption,
  press,
  setNumber,
} from '../../../../harness/forms';

vi.setConfig({ testTimeout: 20_000 });

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), users: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateExitRecordMutation: () => [gql.create],
  useUpdateExitRecordMutation: () => [gql.update],
  useListUsersQuery: () => gql.users(),
}));

const row: ExitRecordRow = {
  id: 'exit-2',
  employeeId: 'user-1',
  resignationDate: localIso(2026, 7, 1),
  lastWorkingDate: localIso(2026, 8, 30),
  noticePeriodDays: 60,
  reason: 'Relocating',
  stage: ExitStage.Clearance,
  assetsReturned: true,
  knowledgeTransferDone: true,
  exitInterviewNotes: 'Positive',
  finalSettlementAmount: 125000,
  documentsIssued: false,
  daysToLastWorkingDay: 12,
};

function renderForm(initial: ExitRecordRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<ExitRecordForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('ExitRecordForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({});
    gql.update.mockReset().mockResolvedValue({});
    gql.users.mockReset().mockReturnValue({ data: { listUsers: USERS } });
  });

  it('asks for the employee and the resignation date', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Resignation date is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a negative notice period or settlement', async () => {
    renderForm(row);

    setNumber('Notice period (days)', '-3');
    setNumber('Final settlement', '-100');
    await press('Update');

    expect(await screen.findAllByText('Must be ≥ 0')).toHaveLength(2);
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('creates an exit, sending an unknown last day and settlement as null', async () => {
    const { onDone } = renderForm();

    await pickOption('Employee', 'Bo Chen (bo@example.com)');
    pickDate('resignationDate', '08/03/2026');
    setNumber('Notice period (days)', '30');
    await chooseOption('Stage', 'Notice Period');
    await userEvent.click(screen.getByLabelText('Knowledge transfer done'));
    await press('Create');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: {
            employeeId: 'user-2',
            resignationDate: localIso(2026, 7, 3),
            lastWorkingDate: null,
            noticePeriodDays: 30,
            reason: '',
            stage: ExitStage.NoticePeriod,
            assetsReturned: false,
            knowledgeTransferDone: true,
            exitInterviewNotes: '',
            finalSettlementAmount: null,
            documentsIssued: false,
          },
        },
      }),
    );
    expect(await screen.findByText('ExitRecord created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('updates an existing exit by id, keeping its last day and settlement', async () => {
    renderForm(row);

    setNumber('Final settlement', '130000');
    await userEvent.click(screen.getByLabelText('Documents issued'));
    await press('Update');

    await waitFor(() =>
      expect(gql.update).toHaveBeenCalledWith({
        variables: {
          id: 'exit-2',
          input: {
            employeeId: 'user-1',
            resignationDate: row.resignationDate,
            lastWorkingDate: row.lastWorkingDate,
            noticePeriodDays: 60,
            reason: 'Relocating',
            stage: ExitStage.Clearance,
            assetsReturned: true,
            knowledgeTransferDone: true,
            exitInterviewNotes: 'Positive',
            finalSettlementAmount: 130000,
            documentsIssued: true,
          },
        },
      }),
    );
    expect(await screen.findByText('ExitRecord updated')).toBeInTheDocument();
  });

  it('says why the save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Settlement is already paid'));
    const { onDone } = renderForm(row);

    await press('Update');

    expect(await screen.findByText('Settlement is already paid')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on cancel', async () => {
    gql.users.mockReturnValue({ data: undefined });
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
