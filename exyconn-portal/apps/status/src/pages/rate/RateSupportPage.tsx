import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Card, Flex, Typography, fontWeight, iconSize } from '@exyconn/shell/components/ui';
import { FormSkeleton, SkeletonStatus } from '@exyconn/shell/components/feedback/skeletons';
import { useSupportCsatSurveyQuery } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { LinkExpiredCard } from '../../components/LinkExpiredCard';
import { RateSupportForm } from './forms/rate-support';

/** What a customer sees once their answer is in, now or from an earlier visit. */
function ThanksCard({ score }: Readonly<{ score: number | null | undefined }>) {
  const t = useT();
  return (
    <Card variant="outlined" sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <CheckCircleIcon color="success" sx={{ fontSize: iconSize['5xl'] }} />
      <Typography variant="h5" sx={{ fontWeight: fontWeight.bold, mt: 1 }}>
        {t('Thank you for your feedback')}
      </Typography>
      {score != null && (
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
          {t('You rated our support {score} out of 5.', { score })}
        </Typography>
      )}
    </Card>
  );
}

/**
 * The page a support satisfaction survey links to. No account: the link the customer was
 * emailed when their ticket was resolved is what identifies the ticket, and it takes one answer.
 */
export function RateSupportPage() {
  const t = useT();
  const navigate = useNavigate();
  const { token = '' } = useParams();
  const [rated, setRated] = useState(false);
  const { data, loading, refetch } = useSupportCsatSurveyQuery({
    variables: { token },
    skip: !token,
    fetchPolicy: 'network-only',
  });

  if (loading) {
    return (
      <SkeletonStatus>
        <FormSkeleton fields={2} />
      </SkeletonStatus>
    );
  }
  const survey = data?.supportCsatSurvey;
  if (!survey) {
    return <LinkExpiredCard />;
  }
  if (rated || survey.score != null) {
    return <ThanksCard score={survey.score} />;
  }

  return (
    <Flex direction="column" spacing={3}>
      <Box>
        <Typography variant="h5" component="h1" sx={{ fontWeight: fontWeight.bold }}>
          {t('How did we do?')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {t('Your ticket {reference} — {subject} — is resolved.', {
            reference: survey.reference,
            subject: survey.subject,
          })}
        </Typography>
      </Box>
      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <RateSupportForm
          token={token}
          onRated={() => {
            setRated(true);
            // The thanks shows either way; a failed refresh is only worth a log line.
            refetch().catch((error: unknown) =>
              portalLogger.error('Status: refreshing the rated survey failed', error),
            );
          }}
          onCancel={() => navigate('/')}
        />
      </Card>
    </Flex>
  );
}
