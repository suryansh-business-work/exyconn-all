// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TrackerTask } from '@shared/types';
import useProjectTasks, { type ProjectTasks } from './useProjectTasks';
import {
  deferred,
  flush,
  render,
  rerender,
  stubTracker,
  unmountAll,
} from '../a11y/component-harness';

const TASK: TrackerTask = { id: 't1', key: 'EXY-1', title: 'Onboarding', assignedToMe: true };

let latest: ProjectTasks = { tasks: [], loading: false };

function Probe({ projectId }: Readonly<{ projectId: string }>): ReactElement {
  latest = useProjectTasks(projectId);
  return <span />;
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe('useProjectTasks', () => {
  it('is loading until the project’s tickets arrive', async () => {
    const answer = deferred<TrackerTask[]>();
    stubTracker({ getTasks: () => answer.promise });
    await render(<Probe projectId="p1" />);
    expect(latest).toEqual({ tasks: [], loading: true });
    answer.resolve([TASK]);
    await flush();
    expect(latest).toEqual({ tasks: [TASK], loading: false });
  });

  it('asks nothing without a project, and stops loading when the portal fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getTasks = vi.fn(() => Promise.reject(new Error('Offline')));
    stubTracker({ getTasks });
    await render(<Probe projectId="" />);
    expect(latest).toEqual({ tasks: [], loading: false });
    expect(getTasks).not.toHaveBeenCalled();
    await rerender(<Probe projectId="p2" />);
    await flush();
    expect(latest).toEqual({ tasks: [], loading: false });
    expect(log).toHaveBeenCalledWith('Loading tickets failed', expect.any(Error));
  });

  it('ignores an answer for a project that is no longer chosen', async () => {
    const stale = deferred<TrackerTask[]>();
    stubTracker({ getTasks: () => stale.promise });
    await render(<Probe projectId="p1" />);
    await rerender(<Probe projectId="" />);
    stale.resolve([TASK]);
    await flush();
    expect(latest).toEqual({ tasks: [], loading: false });
  });
});
