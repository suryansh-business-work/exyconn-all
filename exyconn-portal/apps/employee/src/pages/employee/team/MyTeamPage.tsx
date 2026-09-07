import { useCallback, useMemo } from 'react';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useMyDirectReportsQuery } from '@exyconn/shell/graphql/generated';
import { DirectReportsList } from './DirectReportsList';
import { TeamLeaveSection } from './TeamLeaveSection';
import { TeamRequestsSection } from './TeamRequestsSection';
import { TeamReviewsSection } from './TeamReviewsSection';
import { TeamGoalsSection } from './TeamGoalsSection';
import type { NameOf } from './team.types';

/**
 * The manager's view: who reports to them, and everything those people are waiting on —
 * leave, requests, appraisals and goal feedback. Empty for anyone with no reports.
 */
export function MyTeamPage() {
  const { data, loading } = useMyDirectReportsQuery({ fetchPolicy: 'cache-and-network' });
  const reports = useMemo(() => data?.myDirectReports ?? [], [data]);
  const nameById = useMemo(() => new Map(reports.map((r) => [r.id, r.name])), [reports]);
  const nameOf = useCallback<NameOf>((id) => nameById.get(id) ?? id, [nameById]);

  return (
    <Box>
      <PageHeader title="My Team" subtitle="Your direct reports and what they need from you" />
      {reports.length === 0 && (
        <Box sx={[glass, { p: 3 }]}>
          <Text color="text.secondary">
            {loading
              ? 'Loading…'
              : 'Nobody reports to you yet. HR sets reporting lines on the employee record.'}
          </Text>
        </Box>
      )}
      {reports.length > 0 && (
        <Flex direction="column" spacing={2}>
          <DirectReportsList reports={reports} />
          <TeamLeaveSection nameOf={nameOf} />
          <TeamRequestsSection nameOf={nameOf} />
          <TeamReviewsSection nameOf={nameOf} />
          <TeamGoalsSection nameOf={nameOf} />
        </Flex>
      )}
    </Box>
  );
}
