import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { RhfRadioGroup, RhfTextField, type RadioChoice } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSubmitSupportCsatMutation } from '@exyconn/shell/graphql/generated';
import type { RateSupportFormProps } from './rate-support.types';

/** The five answers, best first, as radio values (the server takes the number). */
const SCORES = ['5', '4', '3', '2', '1'] as const;
const SCORE_LABELS: Record<(typeof SCORES)[number], string> = {
  '5': 'Very happy',
  '4': 'Happy',
  '3': 'Neutral',
  '2': 'Unhappy',
  '1': 'Very unhappy',
};
const COMMENT_MAX = 1000;

/** Mirrors the server: a rating from 1 to 5 is required, a comment is optional. */
const schema = z.object({
  score: z.enum(SCORES, { message: 'Choose how happy you are with the help you got' }),
  comment: z.string().trim().max(COMMENT_MAX, `Keep the comment under ${COMMENT_MAX} characters`),
});
type Values = z.infer<typeof schema>;

/** The public satisfaction survey: one rating, an optional comment, one answer per link. */
export function RateSupportForm({ token, onRated, onCancel }: Readonly<RateSupportFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [submit] = useSubmitSupportCsatMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { comment: '' },
  });
  const options: RadioChoice[] = SCORES.map((score) => ({
    value: score,
    label: t('{score} — {label}', { score, label: t(SCORE_LABELS[score]) }),
  }));

  const onSubmit = async (values: Values) => {
    try {
      await submit({
        variables: { token, score: Number(values.score), comment: values.comment },
      });
      onRated();
    } catch (error) {
      notify(errorMessage(error, 'Your rating could not be saved'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send rating"
    >
      <RhfRadioGroup
        name="score"
        label="How happy are you with the help you got?"
        options={options}
        required
      />
      <RhfTextField
        name="comment"
        label="Anything you would like to add?"
        multiline
        rows={3}
        helperText="Optional. What went well, or what we could do better."
      />
    </EntityForm>
  );
}
