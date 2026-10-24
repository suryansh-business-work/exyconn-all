import type { ListTrackerBuildsQuery } from '@exyconn/shell/graphql/generated';

export type TrackerBuildRow = ListTrackerBuildsQuery['listTrackerBuilds'][number];

/**
 * One label for a run. GitHub reports a run as a status until it finishes and a
 * conclusion afterwards, so the two are collapsed into the single word the
 * status chip shows.
 */
export function buildOutcome(run: TrackerBuildRow): string {
  if (run.status !== 'completed') {
    return run.status.replaceAll('_', ' ').toUpperCase();
  }
  return (run.conclusion ?? 'unknown').toUpperCase();
}
