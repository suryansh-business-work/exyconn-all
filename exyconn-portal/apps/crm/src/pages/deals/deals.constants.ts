import { DealStage } from '@exyconn/shell/graphql/generated';

/** The pipeline, left to right, as the board shows it. */
export const PIPELINE_STAGES: readonly DealStage[] = [
  DealStage.Qualifying,
  DealStage.Discovery,
  DealStage.Proposal,
  DealStage.Negotiation,
  DealStage.Won,
  DealStage.Lost,
];

/** Stages a deal has left the open pipeline through. */
export const CLOSED_STAGES: ReadonlySet<DealStage> = new Set([DealStage.Won, DealStage.Lost]);

/** Column tint per stage, so the board reads at a glance. */
export const STAGE_ACCENTS: Record<DealStage, string> = {
  [DealStage.Qualifying]: '#64748b',
  [DealStage.Discovery]: '#4f8cff',
  [DealStage.Proposal]: '#8b5cf6',
  [DealStage.Negotiation]: '#f59e0b',
  [DealStage.Won]: '#22c55e',
  [DealStage.Lost]: '#ff6b6b',
};

/** SCREAMING_SNAKE reads badly as a column heading. */
export function stageLabel(stage: DealStage): string {
  const spaced = stage.replaceAll('_', ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
