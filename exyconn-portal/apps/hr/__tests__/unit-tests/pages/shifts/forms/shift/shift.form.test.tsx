import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShiftForm, type ShiftRow } from '../../../../../../src/pages/shifts/forms/shift';
import { renderWithProviders } from '../../../../test-utils';
import { pickDate, press, setNumber, typeInto } from '../../../../harness/forms';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateShiftMutation: () => [gql.create],
  useUpdateShiftMutation: () => [gql.update],
}));

const ROW: ShiftRow = {
  id: 'shift-1',
  name: 'Morning',
  code: 'AM',
  startTime: '09:00',
  endTime: '18:00',
  breakMinutes: 60,
  graceMinutes: 15,
  active: true,
};

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ShiftRow | null = null) =>
  renderWithProviders(<ShiftForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('ShiftForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('creates a shift with trimmed names, picked times and whole-number minutes', async () => {
    renderForm();
    await typeInto('Name', '  Night  ');
    await typeInto('Code', ' NT ');
    pickDate('startTime', '10:00 PM');
    pickDate('endTime', '06:30 AM');
    setNumber('Break (minutes)', '45');
    setNumber('Grace (minutes)', '10');
    await userEvent.click(screen.getByLabelText('Active'));
    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Night',
          code: 'NT',
          startTime: '22:00',
          endTime: '06:30',
          breakMinutes: 45,
          graceMinutes: 10,
          active: true,
        },
      },
    });
    expect(await screen.findByText('Shift created')).toBeInTheDocument();
  });

  it('opens an existing shift with its values and updates it by id', async () => {
    renderForm(ROW);
    expect(screen.getByLabelText('Name')).toHaveValue('Morning');
    expect(screen.getByLabelText('Active')).toBeChecked();
    setNumber('Grace (minutes)', '0');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'shift-1',
        input: {
          name: 'Morning',
          code: 'AM',
          startTime: '09:00',
          endTime: '18:00',
          breakMinutes: 60,
          graceMinutes: 0,
          active: true,
        },
      },
    });
    expect(await screen.findByText('Shift updated')).toBeInTheDocument();
  });

  it('starts a new shift inactive, with no break and no grace', () => {
    renderForm();

    expect(screen.getByLabelText('Active')).not.toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'Break (minutes)' })).toHaveValue(0);
    expect(screen.getByRole('spinbutton', { name: 'Grace (minutes)' })).toHaveValue(0);
  });

  it('asks for the name, code and both times before anything is sent', async () => {
    renderForm();
    await typeInto('Name', '   ');
    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Code is required')).toBeInTheDocument();
    expect(screen.getByText('Start time is required')).toBeInTheDocument();
    expect(screen.getByText('End time is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses negative break and grace minutes', async () => {
    renderForm(ROW);
    setNumber('Break (minutes)', '-5');
    setNumber('Grace (minutes)', '-1');
    await press('Update');

    expect(await screen.findAllByText('Must be ≥ 0')).toHaveLength(2);
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('Shift code already used'));
    renderForm(ROW);
    await press('Update');

    expect(await screen.findByText('Shift code already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
