/** Green above 70% activity, amber below — a quick read, never a judgement. */
export function activityColor(percent: number): 'success' | 'warning' {
  return percent >= 70 ? 'success' : 'warning';
}

/** How active the interval a screenshot belongs to was, in words. */
export function activityLabel(percent: number): string {
  return `${percent}% active`;
}
