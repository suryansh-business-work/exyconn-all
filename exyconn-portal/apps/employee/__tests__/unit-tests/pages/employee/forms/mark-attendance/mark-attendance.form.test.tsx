import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendanceStatus, useMarkAttendanceMutation } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { mutationTuple, pickerInput } from '../../apolloHookMocks';
import { MarkAttendanceForm } from '../../../../../../src/pages/employee/forms/mark-attendance';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMarkAttendanceMutation: vi.fn(),
}));

const markAttendance = vi.fn();

function setup() {
  const onCancel = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(<MarkAttendanceForm onCancel={onCancel} onDone={onDone} />);
  return { onCancel, onDone };
}

const save = () => userEvent.click(screen.getByRole('button', { name: 'Save' }));
const sentInput = () => markAttendance.mock.calls[0][0].variables.input;

beforeEach(() => {
  markAttendance.mockReset();
  vi.mocked(useMarkAttendanceMutation).mockReturnValue(
    mutationTuple<typeof useMarkAttendanceMutation>(markAttendance),
  );
});

describe('MarkAttendanceForm', () => {
  it('marks today as present with no note by default', async () => {
    markAttendance.mockResolvedValue({ data: { markAttendance: { id: 'att-1' } } });
    const { onDone } = setup();
    expect(screen.getByRole('combobox', { name: /Status/ })).toHaveTextContent('Present');

    await save();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    const input = sentInput();
    expect(new Date(input.date).toDateString()).toBe(new Date().toDateString());
    expect(input.status).toBe(AttendanceStatus.Present);
    expect(input.note).toBe('');
    expect(await screen.findByText('Attendance saved')).toBeInTheDocument();
  });

  it('records the picked day, status and trimmed note', async () => {
    markAttendance.mockResolvedValue({ data: { markAttendance: { id: 'att-2' } } });
    setup();
    fireEvent.change(pickerInput('date'), { target: { value: '03/04/2026' } });
    await userEvent.click(screen.getByRole('combobox', { name: /Status/ }));
    const listbox = screen.getByRole('listbox');
    expect(
      within(listbox)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Absent', 'Half Day', 'Present', 'Wfh']);
    await userEvent.click(within(listbox).getByRole('option', { name: 'Half Day' }));
    await userEvent.type(screen.getByLabelText('Note (optional)'), ' Doctor visit ');
    await save();

    await waitFor(() => expect(markAttendance).toHaveBeenCalledTimes(1));
    // The picker keeps the clock time of the value it replaces, so only the day is fixed.
    expect(markAttendance).toHaveBeenCalledWith({
      variables: {
        input: {
          date: expect.any(String),
          status: AttendanceStatus.HalfDay,
          note: 'Doctor visit',
        },
      },
    });
    const sent = new Date(sentInput().date);
    expect([sent.getFullYear(), sent.getMonth(), sent.getDate()]).toEqual([2026, 2, 4]);
  });

  it('requires a date', async () => {
    setup();
    fireEvent.change(pickerInput('date'), { target: { value: '' } });
    await save();

    expect(await screen.findByText('Date is required')).toBeInTheDocument();
    expect(markAttendance).not.toHaveBeenCalled();
  });

  it('keeps the note under 200 characters', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('Note (optional)'), {
      target: { value: 'n'.repeat(201) },
    });
    await save();

    expect(await screen.findByText('Keep the note under 200 characters')).toBeInTheDocument();
    expect(markAttendance).not.toHaveBeenCalled();
  });

  it('shows the server’s message when saving fails', async () => {
    markAttendance.mockRejectedValue(new Error('Attendance for that day is locked'));
    const { onDone } = setup();
    await save();

    expect(await screen.findByText('Attendance for that day is locked')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    markAttendance.mockRejectedValue('timeout');
    setup();
    await save();

    expect(await screen.findByText('Could not save attendance')).toBeInTheDocument();
  });

  it('cancels without saving', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
