import { describe, it, expect } from 'vitest';
import {
  BACKLOG,
  doneColumnIdOf,
  groupByEpic,
  sprintProgress,
  tasksForSprint,
} from '../../src/pages/projects/sprints/sprint-progress';
import { TaskPriority, TaskType } from '@exyconn/shell/graphql/generated';
import type { TaskFieldsFragment } from '@exyconn/shell/graphql/generated';

interface TaskOverrides {
  columnId?: string;
  storyPoints?: number | null;
  sprintId?: string | null;
  parentTaskId?: string | null;
  type?: TaskType;
}

const task = (id: string, overrides: TaskOverrides = {}): TaskFieldsFragment => ({
  __typename: 'Task',
  id,
  columnId: overrides.columnId ?? 'todo',
  key: `EXY-${id}`,
  title: `Ticket ${id}`,
  description: null,
  type: overrides.type ?? TaskType.Task,
  priority: TaskPriority.Medium,
  assigneeId: '',
  assigneeName: '',
  reporterName: 'Asha Rao',
  labels: [],
  storyPoints: overrides.storyPoints ?? null,
  dueDate: null,
  sprintId: overrides.sprintId ?? null,
  milestoneId: null,
  parentTaskId: overrides.parentTaskId ?? null,
  attachments: [],
  order: 0,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
});

const COLUMNS = [{ id: 'todo' }, { id: 'doing' }, { id: 'done' }];

describe('doneColumnIdOf', () => {
  it('treats the last column as done', () => {
    expect(doneColumnIdOf(COLUMNS)).toBe('done');
  });

  it('has no done column on a board with no columns', () => {
    expect(doneColumnIdOf([])).toBeNull();
  });
});

describe('sprintProgress', () => {
  const TASKS = [
    task('1', { sprintId: 's1', storyPoints: 3, columnId: 'done' }),
    task('2', { sprintId: 's1', storyPoints: 5, columnId: 'doing' }),
    task('3', { sprintId: 's1', storyPoints: 2, columnId: 'done' }),
    task('4', { sprintId: 's2', storyPoints: 8, columnId: 'done' }),
    task('5', { sprintId: null, storyPoints: 13 }),
  ];

  it('counts only the tickets committed to the sprint asked about', () => {
    const progress = sprintProgress(TASKS, 's1', 'done');

    expect(progress.committedPoints).toBe(10);
    expect(progress.ticketCount).toBe(3);
  });

  it('counts a ticket as complete when it sits in the done column', () => {
    const progress = sprintProgress(TASKS, 's1', 'done');

    expect(progress.completedPoints).toBe(5);
    expect(progress.completedTickets).toBe(2);
    expect(progress.percentComplete).toBe(50);
  });

  it('counts an unsized ticket as zero points but still as a ticket', () => {
    const progress = sprintProgress([task('6', { sprintId: 's3', columnId: 'done' })], 's3', 'done');

    expect(progress.committedPoints).toBe(0);
    expect(progress.ticketCount).toBe(1);
  });

  it('reports an empty sprint as nought per cent, never as finished', () => {
    expect(sprintProgress([], 's9', 'done').percentComplete).toBe(0);
  });

  it('completes nothing when the board has no columns to be done in', () => {
    const progress = sprintProgress(TASKS, 's1', null);

    expect(progress.completedPoints).toBe(0);
    expect(progress.percentComplete).toBe(0);
  });
});

describe('tasksForSprint', () => {
  const TASKS = [task('1', { sprintId: 's1' }), task('2'), task('3', { sprintId: 's2' })];

  it('shows every ticket when nothing is selected', () => {
    expect(tasksForSprint(TASKS, '')).toHaveLength(3);
  });

  it('shows only the selected sprint', () => {
    expect(tasksForSprint(TASKS, 's1').map((t) => t.id)).toEqual(['1']);
  });

  it('shows the tickets in no sprint as the backlog', () => {
    expect(tasksForSprint(TASKS, BACKLOG).map((t) => t.id)).toEqual(['2']);
  });
});

describe('groupByEpic', () => {
  const EPIC = task('e1', { type: TaskType.Epic });
  const TASKS = [
    EPIC,
    task('1', { parentTaskId: 'e1' }),
    task('2', { parentTaskId: 'e1' }),
    task('3'),
  ];

  it('files a ticket under the epic it names', () => {
    const { groups } = groupByEpic(TASKS);

    expect(groups).toHaveLength(1);
    expect(groups[0].children.map((t) => t.id)).toEqual(['1', '2']);
  });

  it('leaves a ticket with no epic loose', () => {
    expect(groupByEpic(TASKS).loose.map((t) => t.id)).toEqual(['3']);
  });

  it('keeps a ticket whose epic is not in the list rather than dropping it', () => {
    const filtered = [task('4', { parentTaskId: 'e-elsewhere' })];

    const { groups, loose } = groupByEpic(filtered);

    expect(groups).toHaveLength(0);
    expect(loose.map((t) => t.id)).toEqual(['4']);
  });

  it('never lists an epic as its own child', () => {
    const { groups, loose } = groupByEpic([EPIC]);

    expect(groups[0].children).toHaveLength(0);
    expect(loose).toHaveLength(0);
  });
});
