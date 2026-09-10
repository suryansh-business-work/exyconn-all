import { DealStage } from '@exyconn/shell/graphql/generated';
import { color } from '@exyconn/shell/components/ui';

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
  [DealStage.Qualifying]: color.slate[500],
  [DealStage.Discovery]: color.blue[400],
  [DealStage.Proposal]: color.violet[400],
  [DealStage.Negotiation]: color.amber[500],
  [DealStage.Won]: color.green[500],
  [DealStage.Lost]: color.red[200],
};

/** SCREAMING_SNAKE reads badly as a column heading. */
export function stageLabel(stage: DealStage): string {
  const spaced = stage.replaceAll('_', ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
