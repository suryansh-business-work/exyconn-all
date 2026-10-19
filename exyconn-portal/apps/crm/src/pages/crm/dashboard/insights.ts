import { CrmInsightKind, type CrmDashboardQuery } from '@exyconn/shell/graphql/generated';

export type InsightRow = CrmDashboardQuery['crmDashboard']['insights'][number];

/** A sentence per finding: the English source for `t()`, singular when it differs, and where to go. */
const COPY: Readonly<Record<CrmInsightKind, { one?: string; other: string; to: string }>> = {
  [CrmInsightKind.LeadSourceConversion]: {
    other: 'Leads from {label} convert {ratio}× better than leads from {compare}',
    to: '/leads',
  },
  [CrmInsightKind.CompanyOriginConversion]: {
    other: 'Companies from {label} become clients {ratio}× as often as companies from {compare}',
    to: '/companies',
  },
  [CrmInsightKind.StuckDeals]: {
    one: '1 deal in {label} has not moved in over {days} days',
    other: '{count} deals in {label} have not moved in over {days} days',
    to: '/deals',
  },
  [CrmInsightKind.PastCloseDate]: {
    one: '1 open deal is past its expected close date',
    other: '{count} open deals are past their expected close date',
    to: '/deals/list',
  },
  [CrmInsightKind.OverdueReminders]: {
    one: '1 reminder is overdue',
    other: '{count} reminders are overdue',
    to: '/calendar',
  },
  [CrmInsightKind.OverdueTasks]: {
    one: '1 task is overdue',
    other: '{count} tasks are overdue',
    to: '/activities',
  },
};

/** An enum value as words: GOOGLE_PLACES -> "Google places". */
export const humanize = (value: string): string => {
  const words = value.replaceAll('_', ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** The sentence key, its values (labels still in English, translated by the caller) and link. */
export function insightCopy(insight: InsightRow) {
  const copy = COPY[insight.kind];
  return {
    text: insight.count === 1 && copy.one ? copy.one : copy.other,
    to: copy.to,
    values: {
      count: insight.count,
      days: insight.days,
      ratio: insight.ratio,
      label: humanize(insight.label),
      compare: humanize(insight.compareLabel),
    },
  };
}
