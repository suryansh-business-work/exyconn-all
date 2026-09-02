import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useMyPerformanceReviewsQuery,
  useSubmitSelfAssessmentMutation,
} from '@exyconn/shell/graphql/generated';
import { SelfAssessmentCard, type ReviewRow } from './SelfAssessmentCard';

/** Employee self-service: appraisal cycles, newest first. */
export function PerformancePage() {
  const { data, loading, refetch } = useMyPerformanceReviewsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [submitSelf] = useSubmitSelfAssessmentMutation();
  const notify = useNotify();
  const reviews = (data?.myPerformanceReviews ?? []) as ReviewRow[];

  const submit = async (id: string, text: string) => {
    await submitSelf({ variables: { id, text } });
    notify('Self-assessment submitted.', 'success');
    await refetch();
  };

  return (
    <Box>
      <PageHeader title="Performance" subtitle="Appraisal cycles and your assessments" />
      {reviews.length === 0 && (
        <Box sx={[glass, { p: 3 }]}>
          <Text color="text.secondary">
            {loading ? 'Loading…' : 'No appraisal cycle has been opened for you yet.'}
          </Text>
        </Box>
      )}
      <Flex direction="column" spacing={2}>
        {reviews.map((review) => (
          <SelfAssessmentCard key={review.id} review={review} onSubmit={submit} />
        ))}
      </Flex>
    </Box>
  );
}
