import { describe, expect, it } from 'vitest';
import { DealStage } from '@exyconn/shell/graphql/generated';
import {
  arrangeBoard,
  dropPosition,
  dropTarget,
  moveDeal,
  stageOfDeal,
  type BoardLayout,
} from '../../../../src/pages/deals/deals.board';

const { Qualifying, Proposal, Won } = DealStage;
const STAGES = [Qualifying, Proposal, Won];

const DEALS = [
  { id: 'a', stage: Proposal },
  { id: 'b', stage: Proposal },
  { id: 'c', stage: Proposal },
  { id: 'd', stage: Won },
];

/** Proposal: a, b, c — Won: d — Qualifying empty. */
const LAYOUT: BoardLayout = { [Qualifying]: [], [Proposal]: ['a', 'b', 'c'], [Won]: ['d'] };

describe('arrangeBoard', () => {
  it('puts each deal in its stage in the server order when nothing was arranged', () => {
    expect(arrangeBoard(DEALS, STAGES, null)).toEqual(LAYOUT);
  });

  it('keeps the order a column was arranged in and adds unseen deals at the bottom', () => {
    const arranged = { [Proposal]: ['c', 'a'] };

    expect(arrangeBoard(DEALS, STAGES, arranged)[Proposal]).toEqual(['c', 'a', 'b']);
  });

  it('drops an arranged id whose deal has left the stage or the board', () => {
    const arranged = { [Proposal]: ['d', 'gone', 'b'] };

    const layout = arrangeBoard(DEALS, STAGES, arranged);

    expect(layout[Proposal]).toEqual(['b', 'a', 'c']);
    expect(layout[Won]).toEqual(['d']);
  });

  it('places a deal with a move in flight in its new stage, at its arranged slot', () => {
    const arranged = { [Won]: ['a', 'd'] };

    const layout = arrangeBoard(DEALS, STAGES, arranged, { a: Won });

    expect(layout[Won]).toEqual(['a', 'd']);
    expect(layout[Proposal]).toEqual(['b', 'c']);
  });

  it('leaves out a deal whose stage is not on the board', () => {
    const stray = { id: 'x', stage: 'ARCHIVED' as DealStage };

    expect(Object.values(arrangeBoard([stray], STAGES, null)).flat()).toEqual([]);
  });
});

describe('stageOfDeal', () => {
  it('finds the column a deal sits in, and nothing for an unknown one', () => {
    expect(stageOfDeal(LAYOUT, 'd')).toBe(Won);
    expect(stageOfDeal(LAYOUT, 'nope')).toBeUndefined();
  });
});

describe('dropTarget', () => {
  it('sends a deal over a column to the bottom of it', () => {
    expect(dropTarget(LAYOUT, 'a', Won)).toEqual({ stage: Won, index: 1 });
    expect(dropTarget(LAYOUT, 'a', Qualifying)).toEqual({ stage: Qualifying, index: 0 });
  });

  it('does not count the carried deal when it is over its own column', () => {
    expect(dropTarget(LAYOUT, 'a', Proposal)).toEqual({ stage: Proposal, index: 2 });
  });

  it('takes the slot of a card in its own column, up or down', () => {
    expect(dropTarget(LAYOUT, 'a', 'c')).toEqual({ stage: Proposal, index: 2 });
    expect(dropTarget(LAYOUT, 'c', 'a')).toEqual({ stage: Proposal, index: 0 });
  });

  it('goes before a card in another column, or after it once past its middle', () => {
    expect(dropTarget(LAYOUT, 'd', 'b')).toEqual({ stage: Proposal, index: 1 });
    expect(dropTarget(LAYOUT, 'd', 'b', true)).toEqual({ stage: Proposal, index: 2 });
    expect(dropTarget(LAYOUT, 'd', 'c', true)).toEqual({ stage: Proposal, index: 3 });
  });

  it('has no target over something that is neither a column nor a card', () => {
    expect(dropTarget(LAYOUT, 'a', 'nowhere')).toBeNull();
  });
});

describe('moveDeal', () => {
  it('takes the deal out of its column and puts it in the target slot', () => {
    expect(moveDeal(LAYOUT, 'd', { stage: Proposal, index: 1 })).toEqual({
      [Qualifying]: [],
      [Proposal]: ['a', 'd', 'b', 'c'],
      [Won]: [],
    });
  });

  it('reorders within a column', () => {
    expect(moveDeal(LAYOUT, 'a', { stage: Proposal, index: 2 })[Proposal]).toEqual(['b', 'c', 'a']);
  });

  it('clamps a slot past either end of the column', () => {
    expect(moveDeal(LAYOUT, 'd', { stage: Proposal, index: 9 })[Proposal]).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
    expect(moveDeal(LAYOUT, 'd', { stage: Proposal, index: -3 })[Proposal]).toEqual([
      'd',
      'a',
      'b',
      'c',
    ]);
  });

  it('starts a column the layout did not have yet', () => {
    const partial: BoardLayout = { [Proposal]: ['a'] };

    expect(moveDeal(partial, 'a', { stage: Won, index: 0 })).toEqual({
      [Proposal]: [],
      [Won]: ['a'],
    });
  });
});

describe('dropPosition', () => {
  it('counts the slot from 1 and the column with the carried deal in it', () => {
    expect(dropPosition(LAYOUT, 'd', 'b')).toEqual({ stage: Proposal, position: 2, count: 4 });
    expect(dropPosition(LAYOUT, 'a', 'c')).toEqual({ stage: Proposal, position: 3, count: 3 });
    expect(dropPosition(LAYOUT, 'a', Qualifying)).toEqual({
      stage: Qualifying,
      position: 1,
      count: 1,
    });
  });

  it('has no position over nothing', () => {
    expect(dropPosition(LAYOUT, 'a', 'nowhere')).toBeNull();
  });
});
