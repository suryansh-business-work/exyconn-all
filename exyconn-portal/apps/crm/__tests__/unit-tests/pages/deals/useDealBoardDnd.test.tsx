import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import type { Active, DragEndEvent, DragOverEvent, DragStartEvent, Over } from '@dnd-kit/core';
import { DealStage } from '@exyconn/shell/graphql/generated';
import { useDealBoardDnd } from '../../../../src/pages/deals/useDealBoardDnd';
import { renderHookWithProviders } from '../../test-utils';
import { dealRow } from '../../fixtures';

const { Proposal, Won } = DealStage;

const DEALS = [
  dealRow({ id: 'a', title: 'Acme rollout', stage: Proposal }),
  dealRow({ id: 'b', title: 'Globex pilot', stage: Proposal }),
  dealRow({ id: 'c', title: 'Initech audit', stage: Won }),
];

/** A carried card; `top` is where its dragged copy is, or null before it has moved. */
const active = (id: string, top: number | null = null) =>
  ({ id, rect: { current: { translated: top === null ? null : { top } } } }) as unknown as Active;
/** A drop target 40px tall starting at `top`. */
const over = (id: string, top = 0) => ({ id, rect: { top, height: 40 } }) as unknown as Over;

const setup = (onMove = vi.fn().mockResolvedValue(undefined)) => {
  const hook = renderHookWithProviders(() => useDealBoardDnd(DEALS, onMove));
  const run = {
    start: (id: string) =>
      act(() => hook.result.current.onDragStart({ active: active(id) } as DragStartEvent)),
    over: (a: Active, o: Over | null) =>
      act(() => hook.result.current.onDragOver({ active: a, over: o } as DragOverEvent)),
    end: (a: Active, o: Over | null) =>
      act(() => hook.result.current.onDragEnd({ active: a, over: o } as DragEndEvent)),
  };
  return { ...hook, run, onMove };
};

describe('useDealBoardDnd', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listens for a pointer, a held finger and the keyboard', () => {
    expect(setup().result.current.sensors).toHaveLength(3);
  });

  it('previews the card in the slot it would land in and lights up that column', () => {
    const { result, run } = setup();

    run.start('c');
    expect(result.current.activeDeal?.id).toBe('c');
    expect(result.current.targetStage).toBe(Won);

    run.over(active('c', 0), over('b'));
    expect(result.current.layout[Proposal]).toEqual(['a', 'c', 'b']);
    expect(result.current.layout[Won]).toEqual([]);
    expect(result.current.targetStage).toBe(Proposal);
  });

  it('leaves the preview alone while the card moves within its own column', () => {
    const { result, run } = setup();

    run.start('a');
    run.over(active('a'), over('b'));
    run.over(active('a'), null);

    expect(result.current.layout[Proposal]).toEqual(['a', 'b']);
  });

  it('keeps the dropped slot and persists the new stage', async () => {
    const { result, run, onMove } = setup();

    run.start('c');
    run.over(active('c', 0), over('a'));
    // Once previewed, the card's own slot is what it is over when it is let go.
    run.end(active('c'), over('c'));

    expect(onMove).toHaveBeenCalledWith('c', Proposal);
    expect(result.current.activeDeal).toBeNull();
    expect(result.current.targetStage).toBeUndefined();
    expect(result.current.layout[Proposal]).toEqual(['c', 'a', 'b']);
    await waitFor(() => expect(result.current.layout[Proposal]).toEqual(['a', 'b']));
  });

  it('reorders within a column without touching the stage', () => {
    const { result, run, onMove } = setup();

    run.start('a');
    run.end(active('a'), over('b'));

    expect(result.current.layout[Proposal]).toEqual(['b', 'a']);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('puts everything back when the card is dropped on nothing', () => {
    const { result, run, onMove } = setup();

    run.start('c');
    run.over(active('c', 0), over(Proposal));
    run.end(active('c'), null);

    expect(result.current.layout[Won]).toEqual(['c']);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('puts everything back when the drag is cancelled', () => {
    const { result, run } = setup();

    run.start('c');
    run.over(active('c', 0), over(Proposal));
    act(() => result.current.onDragCancel());

    expect(result.current.layout[Won]).toEqual(['c']);
    expect(result.current.activeDeal).toBeNull();
  });
});
