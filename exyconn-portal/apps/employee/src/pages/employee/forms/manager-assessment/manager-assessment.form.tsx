import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSubmitManagerAssessmentMutation } from '@exyconn/shell/graphql/generated';
import type { ManagerAssessmentFormValues, TeamReviewRow } from './manager-assessment.types';

const MIN_LENGTH = 20;
const SCORE_MIN = 0;
const SCORE_MAX = 10;

const schema = z.object({
  managerAssessment: z
    .string()
    .trim()
    .min(MIN_LENGTH, `Write at least a few sentences (${MIN_LENGTH}+ characters)`),
  score: z.union([
    z.literal(''),
    z.coerce
      .number()
      .int('Whole numbers only')
      .min(SCORE_MIN, `Score must be between ${SCORE_MIN} and ${SCORE_MAX}`)
      .max(SCORE_MAX, `Score must be between ${SCORE_MIN} and ${SCORE_MAX}`),
  ]),
});

interface ManagerAssessmentFormProps {
  review: TeamReviewRow;
  onCancel: () => void;
  onDone: () => void;
}

/** React Hook Form + Zod form for the manager's half of a direct report's appraisal. */
export function ManagerAssessmentForm({
  review,
  onCancel,
  onDone,
}: Readonly<ManagerAssessmentFormProps>) {
  const notify = useNotify();
  const [submit] = useSubmitManagerAssessmentMutation();
  const methods = useForm<z.input<typeof schema>, unknown, ManagerAssessmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { managerAssessment: review.managerAssessment, score: review.score ?? '' },
  });

  const onSubmit = async (values: ManagerAssessmentFormValues) => {
    try {
      await submit({
        variables: {
          id: review.id,
          managerAssessment: values.managerAssessment,
          score: values.score === '' ? null : values.score,
        },
      });
      notify('Assessment submitted');
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not submit the assessment', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Submit assessment"
    >
      <Box>
        <Text size="overline" color="text.secondary">
          Their self-assessment
        </Text>
        <Text size="sm" sx={{ whiteSpace: 'pre-line' }}>
          {review.selfAssessment || '—'}
        </Text>
      </Box>
      <RhfTextField
        name="managerAssessment"
        label="Your assessment"
        multiline
        minRows={5}
        helperText="What they delivered, where they grew, and what to focus on next."
      />
      <RhfTextField
        name="score"
        label="Score (optional)"
        type="number"
        helperText={`Between ${SCORE_MIN} and ${SCORE_MAX}.`}
        slotProps={{
          htmlInput: { min: SCORE_MIN, max: SCORE_MAX, step: 1 }
        }}
      />
    </EntityForm>
  );
}
