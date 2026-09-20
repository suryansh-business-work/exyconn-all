import {
  ModuleOverview,
  type OverviewBreakdown,
} from '@exyconn/shell/components/dashboard/ModuleOverview';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useComplianceOverviewQuery } from '@exyconn/shell/graphql/generated';
import { ComplianceGaps } from './ComplianceGaps';

/**
 * Compliance → Overview: where the management system stands.
 *
 * The portal opened onto the risk register — five registers and no overview, so "are we
 * ready for an audit" could only be answered by reading all five and counting. Every number
 * here was already in the database; none of it was ever added up.
 */
export function ComplianceOverviewPage() {
  const { formatDate } = useSettings();
  const { data } = useComplianceOverviewQuery({ fetchPolicy: 'cache-and-network' });
  const overview = data?.complianceOverview;

  const statItems: StatItem[] = [
    { label: 'Open risks', value: String(overview?.openRisks ?? 0), accent: color.blue[400] },
    {
      label: 'Open findings',
      value: String(overview?.openFindings ?? 0),
      accent: color.amber[500],
    },
    // The two numbers an auditor opens with, so they are cards rather than something to find.
    {
      label: 'Overdue actions',
      value: String(overview?.findingsOverdue ?? 0),
      accent: color.red[500],
    },
    {
      label: 'Audits planned',
      value: String(overview?.auditsPlanned ?? 0),
      accent: color.teal[600],
    },
  ];

  const breakdowns: OverviewBreakdown[] = [
    {
      title: 'Risks by status',
      buckets: (overview?.risksByStatus ?? []).map((row) => ({
        value: row.label,
        count: row.value,
      })),
      accent: color.blue[400],
    },
    {
      title: 'Findings by type',
      buckets: (overview?.findingsByType ?? []).map((row) => ({
        value: row.label,
        count: row.value,
      })),
      accent: color.amber[500],
    },
  ];

  return (
    <ModuleOverview
      title="Compliance"
      subtitle="ISO 9001, 27001, 45001 and 14001 in one management system"
      stats={statItems}
      breakdowns={breakdowns}
      links={[
        { label: 'Open the risk register', to: '/compliance' },
        { label: 'Findings and CAPA', to: '/compliance/findings' },
        { label: 'Audit programme', to: '/compliance/audits' },
      ]}
      recentTitle="What an auditor will ask about"
    >
      <ComplianceGaps
        standardCoverage={overview?.standardCoverage ?? []}
        residualHeat={overview?.residualHeat ?? []}
        findingsOverdue={overview?.findingsOverdue ?? 0}
        risksPastReview={overview?.risksPastReview ?? 0}
        objectivesAtRisk={overview?.objectivesAtRisk ?? 0}
        lastReviewOn={overview?.lastReviewOn ?? null}
        lastReviewTitle={overview?.lastReviewTitle ?? ''}
        formatDate={formatDate}
      />
    </ModuleOverview>
  );
}
