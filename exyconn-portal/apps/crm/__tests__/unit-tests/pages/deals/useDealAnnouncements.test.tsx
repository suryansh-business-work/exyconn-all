import { describe, expect, it } from 'vitest';
import type { Active, Over } from '@dnd-kit/core';
import { DealStage } from '@exyconn/shell/graphql/generated';
import { useDealAnnouncements } from '../../../../src/pages/deals/useDealAnnouncements';
import type { BoardLayout } from '../../../../src/pages/deals/deals.board';
import { renderHookWithProviders } from '../../test-utils';
import { dealRow } from '../../fixtures';

const DEALS = [
  dealRow({ id: 'a', title: 'Acme rollout', stage: DealStage.Proposal }),
  dealRow({ id: 'b', title: 'Globex pilot', stage: DealStage.Proposal }),
  dealRow({ id: 'c', title: 'Initech audit', stage: DealStage.Won }),
];
const LAYOUT: BoardLayout = {
  [DealStage.Qualifying]: [],
  [DealStage.Proposal]: ['a', 'b'],
  [DealStage.Won]: ['c'],
};

const node = (id: string) => ({ id }) as unknown as Active & Over;

const setup = () =>
  renderHookWithProviders(() => useDealAnnouncements(LAYOUT, DEALS)).result.current;

describe('useDealAnnouncements', () => {
  it('tells a screen reader how to carry a deal with the keyboard', () => {
    expect(setup().screenReaderInstructions.draggable).toMatch(/^To pick up a deal, press Space/);
  });

  it('names the deal picked up', () => {
    const { announcements } = setup();

    expect(announcements.onDragStart({ active: node('a') })).toBe('Picked up deal Acme rollout.');
    expect(announcements.onDragStart({ active: node('gone') })).toBe('Picked up deal .');
  });

  it('announces the stage and the exact slot the deal would land in', () => {
    const { announcements } = setup();

    expect(announcements.onDragOver?.({ active: node('c'), over: node('b') })).toBe(
      'Initech audit: Proposal, position 2 of 3.',
    );
    expect(
      announcements.onDragOver?.({ active: node('a'), over: node(DealStage.Qualifying) }),
    ).toBe('Acme rollout: Qualifying, position 1 of 1.');
  });

  it('says when the deal is over nothing it can land on', () => {
    const { announcements } = setup();

    expect(announcements.onDragOver?.({ active: node('a'), over: null })).toBe(
      'Acme rollout is not over a stage.',
    );
    expect(announcements.onDragOver?.({ active: node('a'), over: node('nowhere') })).toBe(
      'Acme rollout is not over a stage.',
    );
  });

  it('confirms where the deal was dropped, or that the move was cancelled', () => {
    const { announcements } = setup();

    expect(announcements.onDragEnd({ active: node('a'), over: node('b') })).toBe(
      'Acme rollout dropped in Proposal, position 2 of 2.',
    );
    expect(announcements.onDragEnd({ active: node('a'), over: null })).toBe('Moving cancelled.');
    expect(announcements.onDragCancel({ active: node('a'), over: null })).toBe('Moving cancelled.');
  });
});
