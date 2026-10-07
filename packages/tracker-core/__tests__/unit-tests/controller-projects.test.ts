import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackerTask } from '../../src/types';
import { deviceTimezone } from '../../src/timezone';
import { rig, signedIn } from './controller-fixture';

function task(id: string): TrackerTask {
  return { id, key: id.toUpperCase(), title: `Ticket ${id}`, assignedToMe: false };
}

describe('TrackerController projects and tickets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('books against the Global Project until the employee picks another', async () => {
    const setup = await signedIn();

    expect(setup.controller.getState().selectedProjectId).toBe('global');
    expect(setup.controller.setProject('p2')).toBe('p2');
    expect(setup.store.setSelectedProject).toHaveBeenCalledWith('p2');
  });

  it('falls back to the first project when the stored one is no longer offered', async () => {
    const setup = await signedIn();

    expect(setup.controller.setProject('archived')).toBe('global');
  });

  it('has no project at all when the portal offers none', async () => {
    const setup = await signedIn({ projects: [] });

    expect(setup.controller.getState().selectedProjectId).toBe('');
    expect(setup.portal.fetchTasks).not.toHaveBeenCalled();
    expect(setup.latest().tasksLoading).toBe(false);
  });

  it('shows the loading state, then the selected project’s tickets', async () => {
    const setup = await signedIn();
    let answer: (tasks: TrackerTask[]) => void = () => undefined;
    vi.mocked(setup.portal.fetchTasks).mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );

    setup.controller.setProject('p2');
    expect(setup.latest().tasksLoading).toBe(true);
    answer([task('t1')]);
    await vi.advanceTimersByTimeAsync(0);

    expect(setup.portal.fetchTasks).toHaveBeenLastCalledWith('p2');
    expect(setup.latest()).toMatchObject({ tasks: [task('t1')], tasksLoading: false });
  });

  it('lets only the newest ticket read land when the employee switches quickly', async () => {
    const setup = await signedIn();
    const answers: Array<(tasks: TrackerTask[]) => void> = [];
    vi.mocked(setup.portal.fetchTasks).mockImplementation(
      () =>
        new Promise((resolve) => {
          answers.push(resolve);
        }),
    );

    setup.controller.setProject('p2');
    setup.controller.setProject('global');
    answers[1]([task('fresh')]);
    await vi.advanceTimersByTimeAsync(0);
    answers[0]([task('stale')]);
    await vi.advanceTimersByTimeAsync(0);

    expect(setup.latest()).toMatchObject({ tasks: [task('fresh')], tasksLoading: false });
  });

  it('logs a failed ticket read and keeps the picker usable', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = await signedIn();
    const cause = new Error('tickets down');
    vi.mocked(setup.portal.fetchTasks).mockRejectedValue(cause);

    setup.controller.setProject('p2');
    await vi.advanceTimersByTimeAsync(0);

    expect(error).toHaveBeenCalledWith('Loading tickets failed', cause);
    expect(setup.latest().tasksLoading).toBe(false);
  });

  it('logs a ticket read that fails right after sign-in, staying signed in', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const setup = rig();
    const cause = new Error('tickets down');
    vi.mocked(setup.portal.fetchTasks).mockRejectedValue(cause);

    const result = await setup.controller.login('asha@example.com', randomUUID(), false);
    await vi.advanceTimersByTimeAsync(0);

    expect(result.ok).toBe(true);
    expect(error).toHaveBeenCalledWith('Loading tickets failed', cause);
    expect(setup.latest()).toMatchObject({ status: 'idle', tasksLoading: false });
  });

  it('keeps a ticket only while it is on the current board', async () => {
    const setup = await signedIn();
    vi.mocked(setup.portal.fetchTasks).mockResolvedValue([task('t1')]);
    setup.controller.setProject('p2');
    await vi.advanceTimersByTimeAsync(0);

    expect(setup.controller.setTask('t1')).toBe('t1');
    expect(setup.controller.setTask('gone')).toBe('');
    expect(setup.store.selectedTaskId).toBe('gone');
  });

  it('reads no tickets while signed out', async () => {
    const setup = rig();

    setup.controller.setProject('p2');
    await vi.advanceTimersByTimeAsync(0);

    expect(setup.portal.fetchTasks).not.toHaveBeenCalled();
    expect(setup.latest().tasks).toEqual([]);
  });
});

describe('TrackerController zone', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('adopts the zone the portal stored, not the one that was sent', async () => {
    const setup = await signedIn();
    vi.mocked(setup.portal.setTimezone).mockResolvedValue('Asia/Tokyo');

    await expect(setup.controller.setTimezone('Asia/Kolkata')).resolves.toBe('Asia/Tokyo');
    expect(setup.latest().timezone).toBe('Asia/Tokyo');
  });

  it('falls back to this device when the portal stored a zone it cannot resolve', async () => {
    const setup = await signedIn();
    vi.mocked(setup.portal.setTimezone).mockResolvedValue('Nowhere/Land');

    await expect(setup.controller.setTimezone('Nowhere/Land')).resolves.toBe(deviceTimezone());
  });

  it('asks for the report in the zone the UI renders in', async () => {
    const setup = await signedIn({ timezone: 'Asia/Kolkata' });

    await setup.controller.getReport('2026-02-01', '2026-03-01');

    expect(setup.portal.fetchMyReport).toHaveBeenCalledWith(
      '2026-02-01',
      '2026-03-01',
      'Asia/Kolkata',
    );
  });
});
