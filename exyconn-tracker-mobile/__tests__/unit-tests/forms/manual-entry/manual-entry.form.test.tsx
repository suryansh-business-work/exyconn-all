import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ManualEntry, TrackerProject, TrackerTask } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ManualEntryForm, MANUAL_ENTRY_LIMITS } from '../../../../src/forms/manual-entry';
import { tracker } from '../../../../src/tracker/instance';
import { deferred } from '../../hooks/deferred';
import { renderWithProviders } from '../../test-utils';
import { typeInto } from '../field';
import { failingOn } from '../unexpected';

vi.mock('../../../../src/tracker/instance', () => ({
  tracker: { getTasks: vi.fn(), createManualEntry: vi.fn() },
}));

const HOUR = 3_600_000;
const PROJECTS: TrackerProject[] = [
  { id: 'p1', name: 'Website', key: 'WEB' },
  { id: 'p2', name: 'Mobile app', key: 'APP' },
];
const TASK: TrackerTask = { id: 't1', key: 'EXY-14', title: 'Fix login', assignedToMe: true };

const FILED: ManualEntry = {
  id: 'm1',
  projectName: 'Website',
  taskKey: 'EXY-14',
  taskTitle: 'Fix login',
  startedAt: '2026-09-11T09:00:00.000Z',
  endedAt: '2026-09-11T10:00:00.000Z',
  durationMs: HOUR,
  note: 'Client visit',
  status: 'PENDING',
  reviewNote: '',
};

function renderForm(projects: readonly TrackerProject[] = PROJECTS) {
  const onCancel = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(
    <ManualEntryForm projects={projects} timezone="UTC" onCancel={onCancel} onDone={onDone} />,
  );
  return { onCancel, onDone };
}

/** Opens a date field's inline (iOS) picker, picks the instant, and closes it again. */
function pickDateTime(label: string, iso: string): void {
  fireEvent.click(screen.getByRole('button', { name: `${label}: not set` }));
  fireEvent.change(screen.getByLabelText('date-time-picker-datetime'), { target: { value: iso } });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}: `) }));
}

function submit(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Submit claim' }));
}

describe('ManualEntryForm', () => {
  it('starts on the first project with no ticket, loading its tickets', async () => {
    vi.mocked(tracker.getTasks).mockResolvedValue([TASK]);
    renderForm();
    expect(MANUAL_ENTRY_LIMITS.maxBackdateMs).toBe(90 * 24 * HOUR);
    expect(screen.getByRole('button', { name: 'Project: Website' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ticket: No ticket' })).toBeInTheDocument();
    expect(screen.getByText('Loading tickets…')).toBeInTheDocument();
    expect(tracker.getTasks).toHaveBeenCalledWith('p1');
    await waitFor(() => expect(screen.queryByText('Loading tickets…')).not.toBeInTheDocument());
  });

  it('asks for the window and what the time was for', async () => {
    vi.mocked(tracker.getTasks).mockResolvedValue([]);
    renderForm();
    submit();
    expect(await screen.findByText('When did the work start?')).toBeInTheDocument();
    expect(screen.getByText('When did it end?')).toBeInTheDocument();
    expect(screen.getByText('Say what the time was for.')).toBeInTheDocument();
    expect(tracker.createManualEntry).not.toHaveBeenCalled();
  });

  it('files a complete claim against the chosen ticket, then hands back', async () => {
    vi.mocked(tracker.getTasks).mockResolvedValue([TASK]);
    vi.mocked(tracker.createManualEntry).mockResolvedValue(FILED);
    const { onDone } = renderForm();
    await waitFor(() => expect(screen.queryByText('Loading tickets…')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Ticket: No ticket' }));
    fireEvent.click(screen.getByRole('radio', { name: 'EXY-14 · Fix login' }));
    const startedAt = new Date(Date.now() - 3 * HOUR).toISOString();
    const endedAt = new Date(Date.now() - 2 * HOUR).toISOString();
    pickDateTime('From', startedAt);
    pickDateTime('To', endedAt);
    typeInto('note', ' Client visit ');
    submit();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(tracker.createManualEntry).toHaveBeenCalledWith({
      projectId: 'p1',
      taskId: 't1',
      startedAt,
      endedAt,
      note: 'Client visit',
    });
  });

  it('drops the ticket when the claim moves to another project', async () => {
    vi.mocked(tracker.getTasks).mockResolvedValue([TASK]);
    renderForm();
    await waitFor(() => expect(screen.queryByText('Loading tickets…')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Ticket: No ticket' }));
    fireEvent.click(screen.getByRole('radio', { name: 'EXY-14 · Fix login' }));
    expect(screen.getByRole('button', { name: 'Ticket: EXY-14 · Fix login' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Project: Website' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Mobile app' }));
    expect(screen.getByRole('button', { name: 'Ticket: No ticket' })).toBeInTheDocument();
    await waitFor(() => expect(tracker.getTasks).toHaveBeenCalledWith('p2'));
  });

  it("shows the portal's reason, and stays open, when the claim is refused", async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getTasks).mockResolvedValue([]);
    vi.mocked(tracker.createManualEntry)
      .mockRejectedValueOnce(new Error('That window overlaps another claim.'))
      .mockRejectedValueOnce(new Error(''));
    const { onDone } = renderForm();
    pickDateTime('From', new Date(Date.now() - 3 * HOUR).toISOString());
    pickDateTime('To', new Date(Date.now() - 2 * HOUR).toISOString());
    typeInto('note', 'Site visit');
    submit();
    expect(await screen.findByText('That window overlaps another claim.')).toBeInTheDocument();
    submit();
    expect(await screen.findByText('The claim could not be filed.')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Filing the claim failed', expect.any(Error));
  });

  it('cancels without filing anything', () => {
    vi.mocked(tracker.getTasks).mockReturnValue(deferred<TrackerTask[]>().promise);
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(tracker.createManualEntry).not.toHaveBeenCalled();
  });

  it('books to no project when the workspace offers none', () => {
    renderForm([]);
    expect(screen.getByRole('button', { name: 'Project: Choose…' })).toBeInTheDocument();
    expect(tracker.getTasks).not.toHaveBeenCalled();
  });

  it('logs a failure it did not expect while handling a refusal', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Translations unavailable');
    vi.mocked(tracker.getTasks).mockResolvedValue([]);
    vi.mocked(tracker.createManualEntry).mockRejectedValue(new Error('offline'));
    renderWithProviders(
      <ManualEntryForm projects={PROJECTS} timezone="UTC" onCancel={vi.fn()} onDone={vi.fn()} />,
      { onMissing: failingOn('The claim could not be filed.', failure) },
    );
    pickDateTime('From', new Date(Date.now() - 3 * HOUR).toISOString());
    pickDateTime('To', new Date(Date.now() - 2 * HOUR).toISOString());
    typeInto('note', 'Site visit');
    submit();
    await waitFor(() => expect(error).toHaveBeenCalledWith('Filing the claim failed', failure));
  });
});
