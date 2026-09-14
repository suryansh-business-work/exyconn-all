/**
 * How far an objective has come from its baseline towards its target, 0-100 — the same
 * arithmetic the server reports (`objectiveAchievement`), repeated here so the form can say
 * what a figure means as it is typed rather than after a save.
 */
export function achievement(baseline: number, target: number, actual: number): number {
  const distance = target - baseline;
  if (distance === 0) {
    return 0;
  }
  const moved = (actual - baseline) / distance;
  return Math.max(0, Math.min(100, Math.round(moved * 100)));
}

/**
 * "62% of the way from 20 to 10", for the helper text under the current value.
 *
 * The three arrive straight from the form, where a number field holds a string until it is
 * parsed, so they are taken as written and converted here.
 */
export function achievementHint(baseline: unknown, target: unknown, actual: unknown): string {
  const from = Number(baseline ?? 0);
  const to = Number(target ?? 0);
  if (from === to) {
    return 'Set a target that differs from the baseline';
  }
  return `${achievement(from, to, Number(actual ?? 0))}% of the way from ${from} to ${to}`;
}
