import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Heading, Text, TextField } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { panel } from '@exyconn/shell/components/glass/glass';

export interface ReviewRow {
  id: string;
  cycle: string;
  selfAssessment: string;
  managerAssessment: string;
  competencies: string;
  score?: number | null;
  rating?: string | null;
  actionPlan: string;
  status: string;
}

interface SelfAssessmentCardProps {
  review: ReviewRow;
  onSubmit: (id: string, text: string) => Promise<void>;
}

/** One appraisal cycle: what the employee wrote, what the manager wrote, the outcome. */
export function SelfAssessmentCard({ review, onSubmit }: Readonly<SelfAssessmentCardProps>) {
  const t = useT();
  const [text, setText] = useState(review.selfAssessment);
  const [saving, setSaving] = useState(false);
  const open = review.status === 'OPEN';

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(review.id, text);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={panel}>
      <Flex direction="row" alignItems="center" spacing={1}>
        <Heading level={6}>{review.cycle}</Heading>
        <StatusChip value={review.status} />
        {review.rating && <StatusChip value={review.rating} />}
      </Flex>

      {review.score !== null && review.score !== undefined && (
        <Text size="sm" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('Score: {score}/10', { score: review.score })}
        </Text>
      )}

      <Text weight="medium" sx={{ mt: 2 }}>
        {t('Your self-assessment')}
      </Text>
      {open ? (
        <>
          <TextField
            fullWidth
            multiline
            minRows={4}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('What did you deliver this cycle?')}
            sx={{ mt: 1 }}
          />
          <Button sx={{ mt: 1 }} disabled={saving || text.trim().length === 0} onClick={submit}>
            {saving ? t('Submitting…') : t('Submit self-assessment')}
          </Button>
        </>
      ) : (
        <Text size="sm" sx={{ whiteSpace: 'pre-line' }}>
          {review.selfAssessment || '—'}
        </Text>
      )}

      <Text weight="medium" sx={{ mt: 2 }}>
        {t('Manager assessment')}
      </Text>
      <Text size="sm" sx={{ whiteSpace: 'pre-line' }}>
        {review.managerAssessment || t('Not shared yet.')}
      </Text>

      {review.actionPlan && (
        <>
          <Text weight="medium" sx={{ mt: 2 }}>
            {t('Action plan')}
          </Text>
          <Text size="sm" sx={{ whiteSpace: 'pre-line' }}>
            {review.actionPlan}
          </Text>
        </>
      )}
    </Box>
  );
}
