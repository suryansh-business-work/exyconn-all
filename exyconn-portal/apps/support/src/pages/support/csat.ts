import type { SupportSlaSummaryQuery } from '@exyconn/shell/graphql/generated';

type Summary = SupportSlaSummaryQuery['supportSlaSummary'];

/**
 * The CSAT figure for a stat card: the share of satisfied answers (rated 4 or 5) and how many
 * answers it rests on, or a dash until somebody has answered a survey. Numbers only, so the
 * card reads the same in every language.
 */
export function csatLabel(summary: Summary | undefined): string {
  if (summary?.csatPercent == null) {
    return '—';
  }
  return `${summary.csatPercent}% (${summary.csatResponses})`;
}
