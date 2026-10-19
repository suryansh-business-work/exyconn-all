import { useMemo } from 'react';
import type { Active, Announcements, Over, ScreenReaderInstructions } from '@dnd-kit/core';
import { useT } from '@exyconn/i18n';
import { dropPosition, type BoardLayout } from './deals.board';
import { stageLabel } from './deals.constants';
import type { DealRow } from './forms/deal';

type Translate = ReturnType<typeof useT>;

interface BoardNames {
  layout: BoardLayout;
  titles: ReadonlyMap<string, string>;
}

const titleOf = ({ titles }: BoardNames, active: Active) => titles.get(String(active.id)) ?? '';

/** "Acme rollout: Proposal, position 2 of 5." — or that it is over nothing it can land on. */
function targetText(board: BoardNames, t: Translate, active: Active, over: Over | null) {
  const target = over ? dropPosition(board.layout, String(active.id), String(over.id)) : null;
  if (target === null) {
    return t('{title} is not over a stage.', { title: titleOf(board, active) });
  }
  return t('{title}: {stage}, position {position} of {count}.', {
    title: titleOf(board, active),
    stage: t(stageLabel(target.stage)),
    position: target.position,
    count: target.count,
  });
}

function endText(board: BoardNames, t: Translate, active: Active, over: Over | null) {
  const target = over ? dropPosition(board.layout, String(active.id), String(over.id)) : null;
  if (target === null) {
    return t('Moving cancelled.');
  }
  return t('{title} dropped in {stage}, position {position} of {count}.', {
    title: titleOf(board, active),
    stage: t(stageLabel(target.stage)),
    position: target.position,
    count: target.count,
  });
}

/**
 * What a screen reader hears while a deal is carried across the board: the stage and the
 * slot it would land in, every time that changes, so a keyboard drag is as exact as a mouse one.
 */
export function useDealAnnouncements(layout: BoardLayout, deals: readonly DealRow[]) {
  const t = useT();
  return useMemo(() => {
    const board: BoardNames = {
      layout,
      titles: new Map(deals.map((deal) => [deal.id, deal.title])),
    };
    const screenReaderInstructions: ScreenReaderInstructions = {
      draggable: t(
        'To pick up a deal, press Space or Enter. Use the arrow keys to move it, then press Space or Enter to drop it, or Escape to cancel.',
      ),
    };
    const announcements: Announcements = {
      onDragStart: ({ active }) => t('Picked up deal {title}.', { title: titleOf(board, active) }),
      onDragOver: ({ active, over }) => targetText(board, t, active, over),
      onDragEnd: ({ active, over }) => endText(board, t, active, over),
      onDragCancel: () => t('Moving cancelled.'),
    };
    return { screenReaderInstructions, announcements };
  }, [layout, deals, t]);
}
