import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Active, DragEndEvent, DragOverEvent, DragStartEvent, Over } from '@dnd-kit/core';
import { isBelow, useKanbanDnd } from '../../src/useKanbanDnd';
import { useKanbanSensors } from '../../src/useKanbanSensors';
import type { BoardLayout } from '../../src/kanban.board';

const LAYOUT: BoardLayout = { todo: ['a', 'b'], done: ['c'] };

/** A carried card; `top` is where its dragged copy is, or null before it has moved. */
const active = (id: string, top: number | null = null) =>
  ({ id, rect: { current: { translated: top === null ? null : { top } } } }) as unknown as Active;
/** A drop target 40px tall starting at `top`. */
const over = (id: string, top = 0) => ({ id, rect: { top, height: 40 } }) as unknown as Over;

function setup() {
  const onDrop = vi.fn();
  const hook = renderHook(() => useKanbanDnd({ layout: LAYOUT, onDrop }));
  const run = {
    start: (id: string) =>
      act(() => hook.result.current.onDragStart({ active: active(id) } as DragStartEvent)),
    over: (a: Active, o: Over | null) =>
      act(() => hook.result.current.onDragOver({ active: a, over: o } as DragOverEvent)),
    end: (a: Active, o: Over | null) =>
      act(() => hook.result.current.onDragEnd({ active: a, over: o } as DragEndEvent)),
  };
  return { ...hook, run, onDrop };
}

describe('isBelow', () => {
  it('is true once the dragged card has passed the middle of the one it is over', () => {
    expect(isBelow(active('a', 30), over('b', 0))).toBe(true);
    expect(isBelow(active('a', 10), over('b', 0))).toBe(false);
    expect(isBelow(active('a'), over('b', 0))).toBe(false);
  });
});

describe('useKanbanSensors', () => {
  it('listens for a pointer, a held finger and the keyboard', () => {
    expect(renderHook(() => useKanbanSensors()).result.current).toHaveLength(3);
  });
});

describe('useKanbanDnd', () => {
  it('previews the card in the slot it would land in and names that column', () => {
    const { result, run } = setup();

    run.start('c');
    expect(result.current.activeId).toBe('c');
    expect(result.current.targetColumn).toBe('done');

    run.over(active('c', 0), over('b'));
    expect(result.current.layout).toEqual({ todo: ['a', 'c', 'b'], done: [] });
    expect(result.current.targetColumn).toBe('todo');
  });

  it('leaves the preview alone while the card moves within its own column', () => {
    const { result, run } = setup();

    run.start('a');
    run.over(active('a'), over('b'));
    run.over(active('a'), null);

    expect(result.current.layout).toBe(LAYOUT);
  });

  it('drops in the previewed slot and says where it came from', () => {
    const { result, run, onDrop } = setup();

    run.start('c');
    run.over(active('c', 0), over('a'));
    // Once previewed, the card's own slot is what it is over when it is let go.
    run.end(active('c'), over('c'));

    expect(onDrop).toHaveBeenCalledWith('c', { column: 'todo', index: 0 }, 'done');
    expect(result.current.activeId).toBeNull();
    expect(result.current.targetColumn).toBeUndefined();
    expect(result.current.layout).toBe(LAYOUT);
  });

  it('puts everything back when the card is dropped on nothing', () => {
    const { result, run, onDrop } = setup();

    run.start('c');
    run.over(active('c', 0), over('todo'));
    run.end(active('c'), null);

    expect(onDrop).not.toHaveBeenCalled();
    expect(result.current.layout).toBe(LAYOUT);
  });

  it('puts everything back when the drag is cancelled', () => {
    const { result, run } = setup();

    run.start('c');
    run.over(active('c', 0), over('todo'));
    act(() => result.current.onDragCancel());

    expect(result.current.layout).toBe(LAYOUT);
    expect(result.current.activeId).toBeNull();
  });

  it('leaves the drag of anything that is not a card to the board', () => {
    const { result, run, onDrop } = setup();

    run.start('todo');
    run.over(active('todo'), over('done'));
    run.end(active('todo'), over('done'));

    expect(result.current.activeId).toBeNull();
    expect(result.current.layout).toBe(LAYOUT);
    expect(onDrop).not.toHaveBeenCalled();
  });
});
