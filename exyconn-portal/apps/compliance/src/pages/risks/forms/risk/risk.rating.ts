/**
 * The band a 1-25 rating falls into, in the same four steps the server uses
 * (`compliance.constants.ts`). Duplicated deliberately rather than fetched: the form says
 * what a rating means WHILE it is being chosen, and a round trip per keystroke to be told
 * "High" would make the register slower to fill in than a spreadsheet.
 */
export function riskLevel(score: number): string {
  if (score >= 15) return 'Critical';
  if (score >= 10) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
}

/** "Inherent rating 15 — Critical", for the helper text under the second axis. */
export function ratingHint(
  label: string,
  likelihood: string | undefined,
  impact: string | undefined,
): string {
  const score = Number(likelihood ?? 0) * Number(impact ?? 0);
  if (!score) {
    return `${label} rating: pick both axes`;
  }
  return `${label} rating ${score} — ${riskLevel(score)}`;
}
