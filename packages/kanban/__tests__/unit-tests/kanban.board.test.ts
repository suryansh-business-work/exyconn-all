import { describe, expect, it } from 'vitest';
import {
  arrangeBoard,
  dropPosition,
  dropTarget,
  moveItem,
  columnOf,
  type BoardLayout,
} from '../../src/kanban.board';

const [Qualifying, Proposal, Won] = ['QUALIFYING', 'PROPOSAL', 'WON'];
const STAGES = [Qualifying, Proposal, Won];

const ITEMS = [
  { id: 'a', column: Proposal },
  { id: 'b', column: Proposal },
  { id: 'c', column: Proposal },
  { id: 'd', column: Won },
];

/** Proposal: a, b, c — Won: d — Qualifying empty. */
const LAYOUT: BoardLayout = { [Qualifying]: [], [Proposal]: ['a', 'b', 'c'], [Won]: ['d'] };

describe('arrangeBoard', () => {
  it('puts each item in its column in the server order when nothing was arranged', () => {
    expect(arrangeBoard(ITEMS, STAGES, null)).toEqual(LAYOUT);
  });

  it('keeps the order a column was arranged in and adds unseen items at the bottom', () => {
    const arranged = { [Proposal]: ['c', 'a'] };

    expect(arrangeBoard(ITEMS, STAGES, arranged)[Proposal]).toEqual(['c', 'a', 'b']);
  });

  it('drops an arranged id whose item has left the column or the board', () => {
    const arranged = { [Proposal]: ['d', 'gone', 'b'] };

    const layout = arrangeBoard(ITEMS, STAGES, arranged);

    expect(layout[Proposal]).toEqual(['b', 'a', 'c']);
    expect(layout[Won]).toEqual(['d']);
  });

  it('places a item with a move in flight in its new column, at its arranged slot', () => {
    const arranged = { [Won]: ['a', 'd'] };

    const layout = arrangeBoard(ITEMS, STAGES, arranged, { a: Won });

    expect(layout[Won]).toEqual(['a', 'd']);
    expect(layout[Proposal]).toEqual(['b', 'c']);
  });

  it('leaves out a item whose column is not on the board', () => {
    const stray = { id: 'x', column: 'ARCHIVED' };

    expect(Object.values(arrangeBoard([stray], STAGES, null)).flat()).toEqual([]);
  });
});

describe('columnOf', () => {
  it('finds the column a item sits in, and nothing for an unknown one', () => {
    expect(columnOf(LAYOUT, 'd')).toBe(Won);
    expect(columnOf(LAYOUT, 'nope')).toBeUndefined();
  });
});

describe('dropTarget', () => {
  it('sends a item over a column to the bottom of it', () => {
    expect(dropTarget(LAYOUT, 'a', Won)).toEqual({ column: Won, index: 1 });
    expect(dropTarget(LAYOUT, 'a', Qualifying)).toEqual({ column: Qualifying, index: 0 });
  });

  it('does not count the carried item when it is over its own column', () => {
    expect(dropTarget(LAYOUT, 'a', Proposal)).toEqual({ column: Proposal, index: 2 });
  });

  it('takes the slot of a card in its own column, up or down', () => {
    expect(dropTarget(LAYOUT, 'a', 'c')).toEqual({ column: Proposal, index: 2 });
    expect(dropTarget(LAYOUT, 'c', 'a')).toEqual({ column: Proposal, index: 0 });
  });

  it('goes before a card in another column, or after it once past its middle', () => {
    expect(dropTarget(LAYOUT, 'd', 'b')).toEqual({ column: Proposal, index: 1 });
    expect(dropTarget(LAYOUT, 'd', 'b', true)).toEqual({ column: Proposal, index: 2 });
    expect(dropTarget(LAYOUT, 'd', 'c', true)).toEqual({ column: Proposal, index: 3 });
  });

  it('has no target over something that is neither a column nor a card', () => {
    expect(dropTarget(LAYOUT, 'a', 'nowhere')).toBeNull();
  });
});

describe('moveItem', () => {
  it('takes the item out of its column and puts it in the target slot', () => {
    expect(moveItem(LAYOUT, 'd', { column: Proposal, index: 1 })).toEqual({
      [Qualifying]: [],
      [Proposal]: ['a', 'd', 'b', 'c'],
      [Won]: [],
    });
  });

  it('reorders within a column', () => {
    expect(moveItem(LAYOUT, 'a', { column: Proposal, index: 2 })[Proposal]).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('clamps a slot past either end of the column', () => {
    expect(moveItem(LAYOUT, 'd', { column: Proposal, index: 9 })[Proposal]).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
    expect(moveItem(LAYOUT, 'd', { column: Proposal, index: -3 })[Proposal]).toEqual([
      'd',
      'a',
      'b',
      'c',
    ]);
  });

  it('starts a column the layout did not have yet', () => {
    const partial: BoardLayout = { [Proposal]: ['a'] };

    expect(moveItem(partial, 'a', { column: Won, index: 0 })).toEqual({
      [Proposal]: [],
      [Won]: ['a'],
    });
  });
});

describe('dropPosition', () => {
  it('counts the slot from 1 and the column with the carried item in it', () => {
    expect(dropPosition(LAYOUT, 'd', 'b')).toEqual({ column: Proposal, position: 2, count: 4 });
    expect(dropPosition(LAYOUT, 'a', 'c')).toEqual({ column: Proposal, position: 3, count: 3 });
    expect(dropPosition(LAYOUT, 'a', Qualifying)).toEqual({
      column: Qualifying,
      position: 1,
      count: 1,
    });
  });

  it('has no position over nothing', () => {
    expect(dropPosition(LAYOUT, 'a', 'nowhere')).toBeNull();
  });
});
