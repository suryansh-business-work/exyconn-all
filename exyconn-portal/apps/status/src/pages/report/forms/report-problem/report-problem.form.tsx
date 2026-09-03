import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { RhfSelect, RhfTextField, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ProblemCategory,
  ProblemSeverity,
  useSubmitProblemReportMutation,
} from '@exyconn/shell/graphql/generated';
import { REPORT_DEFAULTS, reportProblemSchema } from './report-problem.schema';
import type { ReportProblemFormProps } from './report-problem.types';

const CATEGORY_OPTIONS = enumOptions(Object.values(ProblemCategory));
const SEVERITY_OPTIONS = enumOptions(Object.values(ProblemSeverity));
const WHOLE_PLATFORM: SelectOption = { value: '', label: 'Not sure / the whole platform' };

type Values = z.infer<typeof reportProblemSchema>;

/**
 * The public "report a problem" form. Validated with React Hook Form + Zod against the
 * same rules the API enforces, and answered with a reference the reporter can quote —
 * the report itself lands in the Tech portal for triage.
 */
export function ReportProblemForm({
  services,
  onSubmitted,
  onCancel,
}: Readonly<ReportProblemFormProps>) {
  const [submitReport] = useSubmitProblemReportMutation();
  const notify = useNotify();
  const methods = useForm<z.input<typeof reportProblemSchema>, unknown, Values>({
    resolver: zodResolver(reportProblemSchema),
    defaultValues: REPORT_DEFAULTS,
  });

  const onSubmit = async (values: Values) => {
    try {
      const { data } = await submitReport({ variables: { input: values } });
      const reference = data?.submitProblemReport.reference ?? '';
      methods.reset(REPORT_DEFAULTS);
      onSubmitted(reference);
    } catch (error) {
      notify(errorMessage(error, 'Could not send the report'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send report"
    >
      <RhfSelect
        name="serviceKey"
        label="Which service?"
        options={[WHOLE_PLATFORM, ...services]}
        helperText="Pick the service you were using when it went wrong"
      />
      <RhfSelect name="category" label="What kind of problem?" options={CATEGORY_OPTIONS} />
      <RhfSelect name="severity" label="How badly is it blocking you?" options={SEVERITY_OPTIONS} />
      <RhfTextField name="subject" label="Title" helperText="One line we can scan quickly" />
      <RhfTextField
        name="description"
        label="What happened?"
        multiline
        rows={5}
        helperText="What you did, what you expected and what you saw instead"
      />
      <RhfTextField name="reporterName" label="Your name" />
      <RhfTextField name="reporterEmail" label="Your email" helperText="Only used to reply" />
      <RhfTextField
        name="pageUrl"
        label="Page address (optional)"
        helperText="Paste the URL of the page where it happened"
      />
    </EntityForm>
  );
}
