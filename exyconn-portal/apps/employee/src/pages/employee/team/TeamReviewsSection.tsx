import { useState } from 'react';
import { Box, Button, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { glass } from '@exyconn/shell/components/glass/glass';
import { ReviewStatus, useTeamPerformanceReviewsQuery } from '@exyconn/shell/graphql/generated';
import { ManagerAssessmentForm } from '../forms/manager-assessment';
import type { NameOf, TeamReviewRow, TeamSectionProps } from './team.types';

interface ReviewRowProps {
  review: TeamReviewRow;
  nameOf: NameOf;
  onWrite: (review: TeamReviewRow) => void;
}

/** One appraisal: whose, which cycle, where it stands, and the manager's half if written. */
function ReviewRow({ review, nameOf, onWrite }: Readonly<ReviewRowProps>) {
  const awaitingManager = review.status === ReviewStatus.SelfSubmitted;
  return (
    <Flex direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.25 }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Text weight="medium">
          {nameOf(review.employeeId)} · {review.cycle}
        </Text>
        <Text size="sm" color="text.secondary" noWrap>
          {review.managerAssessment || 'No manager assessment yet.'}
        </Text>
      </Box>
      {review.score !== null && review.score !== undefined && (
        <Text size="sm" color="text.secondary">
          {review.score}/10
        </Text>
      )}
      <StatusChip value={review.status} />
      {awaitingManager && (
        <Button size="small" onClick={() => onWrite(review)}>
          Write assessment
        </Button>
      )}
    </Flex>
  );
}

/** Appraisals of the team; the manager writes their half once the employee has submitted. */
export function TeamReviewsSection({ nameOf }: Readonly<TeamSectionProps>) {
  const { data, loading, refetch } = useTeamPerformanceReviewsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [writing, setWriting] = useState<TeamReviewRow | null>(null);
  const rows = data?.teamPerformanceReviews ?? [];

  return (
    <Box sx={[glass, { p: 2 }]}>
      <Heading level={6}>Performance reviews</Heading>
      {rows.length === 0 && (
        <Text size="sm" color="text.secondary">
          {loading ? 'Loading…' : 'No appraisal cycles are open for your team.'}
        </Text>
      )}
      {rows.map((review) => (
        <ReviewRow key={review.id} review={review} nameOf={nameOf} onWrite={setWriting} />
      ))}
      <CrudDialog
        open={writing !== null}
        title={writing ? `Assess ${nameOf(writing.employeeId)} · ${writing.cycle}` : ''}
        onClose={() => setWriting(null)}
      >
        {writing && (
          <ManagerAssessmentForm
            review={writing}
            onCancel={() => setWriting(null)}
            onDone={async () => {
              setWriting(null);
              await refetch();
            }}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
