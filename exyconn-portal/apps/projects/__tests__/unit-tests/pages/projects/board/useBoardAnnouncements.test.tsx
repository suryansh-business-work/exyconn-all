import { describe, expect, it } from 'vitest';
import type { Active, Over } from '@dnd-kit/core';
import { useBoardAnnouncements } from '../../../../../src/pages/projects/board/useBoardAnnouncements';
import { renderHookWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';

const COLUMNS = [
  { id: 'todo', name: 'To do', isDone: false },
  { id: 'done', name: 'Done', isDone: true },
];
const TASKS = [taskRow({ id: 't1', title: 'Login fails', columnId: 'todo' })];

/** A drag participant as dnd-kit describes it: an id and the type the board tagged it with. */
const item = (id: string, type: 'column' | 'task') =>
  ({ id, data: { current: { type } } }) as unknown as Active & Over;
/** A drop target dnd-kit knows nothing about. */
const untyped = (id: string) => ({ id, data: { current: undefined } }) as unknown as Over;

const setup = () => {
  const { result } = renderHookWithProviders(() => useBoardAnnouncements(COLUMNS, TASKS));
  return result.current;
};

describe('useBoardAnnouncements', () => {
  it('tells a screen reader how to carry a task or a column', () => {
    expect(setup().screenReaderInstructions.draggable).toMatch(/^To pick up a task or a column/);
  });

  it('names what was picked up', () => {
    const { announcements } = setup();

    expect(announcements.onDragStart({ active: item('t1', 'task') })).toBe(
      'Picked up task Login fails.',
    );
    expect(announcements.onDragStart({ active: item('done', 'column') })).toBe(
      'Picked up column Done.',
    );
    expect(announcements.onDragStart({ active: item('gone', 'column') })).toBe(
      'Picked up column .',
    );
    expect(announcements.onDragStart({ active: item('gone', 'task') })).toBe('Picked up task .');
  });

  it('says which column a carried item is over, by the column or a task in it', () => {
    const { announcements } = setup();

    expect(
      announcements.onDragOver({ active: item('t1', 'task'), over: item('done', 'column') }),
    ).toBe('Task Login fails is over Done.');
    expect(
      announcements.onDragOver({ active: item('todo', 'column'), over: item('t1', 'task') }),
    ).toBe('Over column To do.');
  });

  it('says when a carried item is over no column at all', () => {
    const { announcements } = setup();

    expect(announcements.onDragOver({ active: item('t1', 'task'), over: null })).toBe(
      'Not over a column.',
    );
    expect(
      announcements.onDragOver({ active: item('t1', 'task'), over: untyped('elsewhere') }),
    ).toBe('Not over a column.');
  });

  it('says where a drop landed, or that it was cancelled', () => {
    const { announcements } = setup();

    expect(
      announcements.onDragEnd({ active: item('t1', 'task'), over: item('done', 'column') }),
    ).toBe('Task Login fails moved to Done.');
    expect(
      announcements.onDragEnd({ active: item('todo', 'column'), over: item('done', 'column') }),
    ).toBe('Column moved to position 2.');
    expect(announcements.onDragEnd({ active: item('t1', 'task'), over: null })).toBe(
      'Moving cancelled.',
    );
    expect(announcements.onDragCancel({ active: item('t1', 'task'), over: null })).toBe(
      'Moving cancelled.',
    );
  });
});
