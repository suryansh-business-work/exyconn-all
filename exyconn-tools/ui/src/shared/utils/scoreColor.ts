export const GOOD_SCORE_COLOR = '#22c55e';
export const FAIR_SCORE_COLOR = '#f59e0b';
export const POOR_SCORE_COLOR = '#ef4444';

export function getScoreColor(score: number): string {
  if (score >= 70) return GOOD_SCORE_COLOR;
  if (score >= 40) return FAIR_SCORE_COLOR;
  return POOR_SCORE_COLOR;
}
