import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MyTrackerManualEntriesDocument,
  useCreateTrackerManualEntryMutation,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { localIso, mutationTuple, pickerInput } from '../../apolloHookMocks';
import { OffComputerTimeForm } from '../../../../../../src/pages/employee/forms/off-computer-time';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateTrackerManualEntryMutation: vi.fn(),
}));

const PROJECTS = [
  { id: 'proj-house', name: 'General' },
  { id: 'proj-acme', name: 'Acme rollout' },
];

const createEntry = vi.fn();

function setup(projects: ReadonlyArray<{ id: string; name: string }> = PROJECTS) {
  const onDone = vi.fn();
  renderWithProviders(<OffComputerTimeForm projects={projects} onDone={onDone} />);
  return { onDone };
}

function enterWindow(started: string, ended: string) {
  fireEvent.change(pickerInput('startedAt'), { target: { value: started } });
  fireEvent.change(pickerInput('endedAt'), { target: { value: ended } });
}

const send = () => userEvent.click(screen.getByRole('button', { name: 'Send for approval' }));
const note = () => screen.getByLabelText('What was the time for?');

beforeEach(() => {
  createEntry.mockReset();
  vi.mocked(useCreateTrackerManualEntryMutation).mockReturnValue(
    mutationTuple<typeof useCreateTrackerManualEntryMutation>(createEntry),
  );
});

describe('OffComputerTimeForm', () => {
  it('refreshes the employee’s own entries after a claim', () => {
    setup();
    expect(useCreateTrackerManualEntryMutation).toHaveBeenCalledWith({
      refetchQueries: [MyTrackerManualEntriesDocument],
    });
    expect(screen.getByText('Time you have already worked')).toBeInTheDocument();
  });

  it('asks when the work started and ended, and what it was for', async () => {
    setup();
    await send();

    expect(await screen.findByText('When did the work start?')).toBeInTheDocument();
    expect(screen.getByText('When did it end?')).toBeInTheDocument();
    expect(screen.getByText('Say what the time was for')).toBeInTheDocument();
    expect(createEntry).not.toHaveBeenCalled();
  });

  it('refuses an entry that ends before it starts', async () => {
    setup();
    enterWindow('01/10/2025 11:00 AM', '01/10/2025 09:00 AM');
    await userEvent.type(note(), 'Client call');
    await send();

    expect(await screen.findByText('The entry must end after it starts')).toBeInTheDocument();
    expect(createEntry).not.toHaveBeenCalled();
  });

  it('refuses an entry longer than sixteen hours', async () => {
    setup();
    enterWindow('01/10/2025 06:00 AM', '01/11/2025 06:00 AM');
    await userEvent.type(note(), 'Site visit');
    await send();

    expect(
      await screen.findByText('One entry cannot cover more than 16 hours'),
    ).toBeInTheDocument();
    expect(createEntry).not.toHaveBeenCalled();
  });

  it('sends a claim on the picked project for approval and says so', async () => {
    createEntry.mockResolvedValue({ data: { createTrackerManualEntry: { id: 'entry-1' } } });
    const { onDone } = setup();
    expect(screen.getByRole('combobox', { name: /Project/ })).toHaveTextContent('General');
    enterWindow('01/10/2025 09:00 AM', '01/10/2025 11:30 AM');
    await userEvent.click(screen.getByRole('combobox', { name: /Project/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Acme rollout' }),
    );
    await userEvent.type(note(), ' Workshop with Acme ');
    await send();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(createEntry).toHaveBeenCalledWith({
      variables: {
        input: {
          startedAt: localIso(2025, 0, 10, 9, 0),
          endedAt: localIso(2025, 0, 10, 11, 30),
          projectId: 'proj-acme',
          note: 'Workshop with Acme',
        },
      },
    });
    expect(await screen.findByText('Sent for approval')).toBeInTheDocument();
  });

  it('books against no project when there is none to pick', async () => {
    createEntry.mockResolvedValue({ data: { createTrackerManualEntry: { id: 'entry-2' } } });
    setup([]);
    enterWindow('01/10/2025 09:00 AM', '01/10/2025 10:00 AM');
    await userEvent.type(note(), 'Team offsite');
    await send();

    await waitFor(() => expect(createEntry).toHaveBeenCalledTimes(1));
    expect(createEntry.mock.calls[0][0].variables.input.projectId).toBeNull();
  });

  it('shows the server’s message when the claim fails', async () => {
    createEntry.mockRejectedValue(new Error('Overlaps a tracked session'));
    const { onDone } = setup();
    enterWindow('01/10/2025 09:00 AM', '01/10/2025 10:00 AM');
    await userEvent.type(note(), 'Client call');
    await send();

    expect(await screen.findByText('Overlaps a tracked session')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    createEntry.mockRejectedValue('nope');
    setup();
    enterWindow('01/10/2025 09:00 AM', '01/10/2025 10:00 AM');
    await userEvent.type(note(), 'Client call');
    await send();

    expect(await screen.findByText('Could not send the entry')).toBeInTheDocument();
  });

  it('closes on Cancel without sending', async () => {
    const { onDone } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(createEntry).not.toHaveBeenCalled();
  });
});
