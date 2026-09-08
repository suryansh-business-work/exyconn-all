import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { ApplicantStage, useSetApplicantStageMutation } from '@exyconn/shell/graphql/generated';
import { STAGE_OPTIONS } from '../../applicants.constants';
import type { ApplicantStageFormProps } from './applicant-stage.types';

export const applicantStageSchema = z.object({
  stage: z.nativeEnum(ApplicantStage),
  note: z.string().trim().max(2000, 'Keep the note under 2000 characters'),
});

type Values = z.infer<typeof applicantStageSchema>;

/** The stages the applicant is emailed about, so the form can say so before Save. */
const NOTIFIED_STAGES = new Set<ApplicantStage>([
  ApplicantStage.Interview,
  ApplicantStage.Offer,
  ApplicantStage.Rejected,
]);

/** Moves one applicant to a new stage, with a line for the history. */
export function ApplicantStageForm({
  applicant,
  onDone,
  onCancel,
}: Readonly<ApplicantStageFormProps>) {
  const notify = useNotify();
  const [setStage] = useSetApplicantStageMutation();
  const methods = useForm<z.input<typeof applicantStageSchema>, unknown, Values>({
    resolver: zodResolver(applicantStageSchema),
    defaultValues: { stage: applicant.stage, note: '' },
  });
  const chosen = methods.watch('stage');

  const onSubmit = async (values: Values) => {
    try {
      await setStage({ variables: { id: applicant.id, stage: values.stage, note: values.note } });
      notify(`${applicant.name} moved to ${values.stage.toLowerCase()}`);
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not move the applicant'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Move"
    >
      <Text size="sm" color="text.secondary">
        {applicant.name} · currently {applicant.stage.toLowerCase()}
      </Text>
      <RhfSelect name="stage" label="Stage" options={STAGE_OPTIONS} />
      <RhfTextField
        name="note"
        label="Note"
        multiline
        rows={3}
        helperText="Kept in the applicant's history; the applicant does not see it"
      />
      {NOTIFIED_STAGES.has(chosen) && (
        <Alert severity="info">The applicant will be emailed about this stage.</Alert>
      )}
    </EntityForm>
  );
}
