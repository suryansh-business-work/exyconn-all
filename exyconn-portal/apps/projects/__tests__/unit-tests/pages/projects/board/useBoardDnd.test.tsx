import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  useBoardDnd,
  type ProjectBoardApi,
  type TaskView,
} from '../../../../../src/pages/projects/board';
import { renderHookWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';

const COLUMNS = [
  { id: 'todo', name: 'To do', isDone: false },
  { id: 'doing', name: 'Doing', isDone: false },
  { id: 'done', name: 'Done', isDone: true },
];
const TASKS = [
  taskRow({ id: 't1', columnId: 'todo' }),
  taskRow({ id: 't2', columnId: 'todo' }),
  taskRow({ id: 't3', columnId: 'doing' }),
];

const api = {
  columns: COLUMNS,
  tasks: TASKS,
  setColumns: vi.fn(),
  setTasks: vi.fn(),
  persistColumnOrder: vi.fn(),
  persistTaskMove: vi.fn(),
};

const setup = () => renderHookWithProviders(() => useBoardDnd(api as unknown as ProjectBoardApi));

/** A drag participant: its id and the type the board tagged it with. */
const node = (id: string, type?: 'column' | 'task') => ({ id, data: { current: { type } } });
const end = (active: ReturnType<typeof node>, over: ReturnType<typeof node> | null) =>
  ({ active, over }) as unknown as DragEndEvent;
const start = (active: ReturnType<typeof node>) => ({ active }) as unknown as DragStartEvent;

/** Where the tasks end up once the hook's state update is applied to the board's tasks. */
const tasksAfterMove = (): Array<Pick<TaskView, 'id' | 'columnId'>> => {
  const update = api.setTasks.mock.calls[0][0] as (prev: TaskView[]) => TaskView[];
  return update(TASKS).map(({ id, columnId }) => ({ id, columnId }));
};

describe('useBoardDnd', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listens for a pointer, a held finger and the keyboard', () => {
    expect(setup().result.current.sensors).toHaveLength(3);
  });

  it('moves a column to a new position and saves the order', () => {
    const { result } = setup();

    act(() => result.current.moveColumn('todo', 2));

    expect(api.setColumns).toHaveBeenCalledWith([COLUMNS[1], COLUMNS[2], COLUMNS[0]]);
    expect(api.persistColumnOrder).toHaveBeenCalledWith(['doing', 'done', 'todo']);
  });

  it('ignores a column move that goes nowhere or off the board', () => {
    const { result } = setup();

    act(() => {
      result.current.moveColumn('missing', 1);
      result.current.moveColumn('todo', -1);
      result.current.moveColumn('todo', 3);
      result.current.moveColumn('doing', 1);
    });

    expect(api.setColumns).not.toHaveBeenCalled();
    expect(api.persistColumnOrder).not.toHaveBeenCalled();
  });

  it('sends a ticket to the end of another column from the ticket dialog', () => {
    const { result } = setup();

    act(() => result.current.moveTaskToColumn('t1', 'doing'));

    expect(api.persistTaskMove).toHaveBeenCalledWith('t1', 'doing', 1);
    expect(tasksAfterMove()).toEqual([
      { id: 't2', columnId: 'todo' },
      { id: 't3', columnId: 'doing' },
      { id: 't1', columnId: 'doing' },
    ]);
  });

  it('counts the column without the moving ticket itself', () => {
    const { result } = setup();

    act(() => result.current.moveTaskToColumn('t2', 'todo'));

    expect(api.persistTaskMove).toHaveBeenCalledWith('t2', 'todo', 1);
  });

  it('leaves the tasks alone when the moving ticket is not on the board', () => {
    const { result } = setup();

    act(() => result.current.moveTaskToColumn('ghost', 'doing'));

    const update = api.setTasks.mock.calls[0][0] as (prev: TaskView[]) => TaskView[];
    expect(update(TASKS)).toBe(TASKS);
  });

  it('holds the ticket being dragged, but not a column, until the drag ends or is cancelled', () => {
    const { result } = setup();

    act(() => result.current.onDragStart(start(node('t3', 'task'))));
    expect(result.current.activeTask?.id).toBe('t3');

    act(() => result.current.onDragCancel());
    expect(result.current.activeTask).toBeNull();

    act(() => result.current.onDragStart(start(node('todo', 'column'))));
    expect(result.current.activeTask).toBeNull();

    act(() => result.current.onDragStart(start(node('ghost', 'task'))));
    expect(result.current.activeTask).toBeNull();

    act(() => result.current.onDragStart(start(node('t1', 'task'))));
    act(() => result.current.onDragEnd(end(node('t1', 'task'), null)));
    expect(result.current.activeTask).toBeNull();
    expect(api.persistTaskMove).not.toHaveBeenCalled();
  });

  it('drops a column on another column, or on a ticket in it, at that column’s place', () => {
    const { result } = setup();

    act(() => result.current.onDragEnd(end(node('done', 'column'), node('todo', 'column'))));
    expect(api.persistColumnOrder).toHaveBeenLastCalledWith(['done', 'todo', 'doing']);

    act(() => result.current.onDragEnd(end(node('todo', 'column'), node('t3', 'task'))));
    expect(api.persistColumnOrder).toHaveBeenLastCalledWith(['doing', 'todo', 'done']);
  });

  it('ignores a column dropped on itself or on a ticket the board does not know', () => {
    const { result } = setup();

    act(() => {
      result.current.onDragEnd(end(node('todo', 'column'), node('todo', 'column')));
      result.current.onDragEnd(end(node('todo', 'column'), node('ghost', 'task')));
    });

    expect(api.persistColumnOrder).not.toHaveBeenCalled();
  });

  it('drops a ticket at the place of the ticket it lands on', () => {
    const { result } = setup();

    act(() => result.current.onDragEnd(end(node('t3', 'task'), node('t2', 'task'))));

    expect(api.persistTaskMove).toHaveBeenCalledWith('t3', 'todo', 1);
    expect(tasksAfterMove()).toEqual([
      { id: 't1', columnId: 'todo' },
      { id: 't3', columnId: 'todo' },
      { id: 't2', columnId: 'todo' },
    ]);
  });

  it('drops a ticket on an empty stretch of a column at its end', () => {
    const { result } = setup();

    act(() => result.current.onDragEnd(end(node('t1', 'task'), node('done', 'column'))));

    expect(api.persistTaskMove).toHaveBeenCalledWith('t1', 'done', 0);
  });

  it('ignores a ticket dropped on a ticket the board does not know', () => {
    const { result } = setup();

    act(() => result.current.onDragEnd(end(node('t1', 'task'), node('ghost', 'task'))));

    expect(api.persistTaskMove).not.toHaveBeenCalled();
    expect(api.setTasks).not.toHaveBeenCalled();
  });
});
