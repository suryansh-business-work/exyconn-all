import { describe, expect, it } from 'vitest';
import { DealStage } from '@exyconn/shell/graphql/generated';
import {
  CLOSED_STAGES,
  PIPELINE_STAGES,
  STAGE_ACCENTS,
  stageLabel,
} from '../../../../src/pages/deals/deals.constants';

describe('deals constants', () => {
  it('orders the board from the first conversation to the outcome', () => {
    expect(PIPELINE_STAGES).toEqual([
      DealStage.Qualifying,
      DealStage.Discovery,
      DealStage.Proposal,
      DealStage.Negotiation,
      DealStage.Won,
      DealStage.Lost,
    ]);
  });

  it('treats only won and lost as closed', () => {
    expect([...CLOSED_STAGES]).toEqual([DealStage.Won, DealStage.Lost]);
    expect(CLOSED_STAGES.has(DealStage.Proposal)).toBe(false);
  });

  it('tints every stage of the board', () => {
    for (const stage of Object.values(DealStage)) {
      expect(STAGE_ACCENTS[stage]).toEqual(expect.any(String));
    }
  });
});

describe('stageLabel', () => {
  it('sentence-cases a one-word stage', () => {
    expect(stageLabel(DealStage.Negotiation)).toBe('Negotiation');
    expect(stageLabel(DealStage.Won)).toBe('Won');
  });

  it('turns underscores into spaces', () => {
    expect(stageLabel('CLOSED_WON_LATE' as DealStage)).toBe('Closed won late');
  });
});
