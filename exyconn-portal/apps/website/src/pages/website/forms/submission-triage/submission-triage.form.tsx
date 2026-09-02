import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useTriageWebsiteSubmissionMutation } from '@exyconn/shell/graphql/generated';
import { SUBMISSION_STATUSES, toOptions } from '../../website.constants';
import type { WebsiteSubmissionRow } from './submission-triage.types';

const schema = z.object({
  status: z.string().trim().min(1, 'Status is required'),
  notes: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const STATUS_OPTIONS = toOptions(SUBMISSION_STATUSES);

interface SubmissionTriageFormProps {
  /** Submissions are created by the public website, so a row always exists here. */
  submission: WebsiteSubmissionRow;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to triage an existing website form submission. */
export function SubmissionTriageForm({
  submission,
  onDone,
  onCancel,
}: Readonly<SubmissionTriageFormProps>) {
  const notify = useNotify();
  const [triageSubmission] = useTriageWebsiteSubmissionMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { status: submission.status, notes: submission.notes },
  });

  const onSubmit = async (values: Values) => {
    try {
      await triageSubmission({ variables: { id: submission.id, input: values } });
      notify('Submission triaged');
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save triage"
    >
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField
        name="notes"
        label="Notes"
        multiline
        minRows={4}
        helperText="Internal triage notes — never shown on the website."
      />
    </EntityForm>
  );
}
