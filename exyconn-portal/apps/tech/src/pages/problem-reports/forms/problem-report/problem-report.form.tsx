import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { RhfSelect, RhfTextField, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  useCreateProblemReportMutation,
  useListStatusMonitorsQuery,
  useUpdateProblemReportMutation,
} from '@exyconn/shell/graphql/generated';
import {
  PROBLEM_CATEGORIES,
  PROBLEM_SEVERITIES,
  PROBLEM_STATUSES,
} from '../../problem-reports.constants';
import {
  problemReportSchema,
  toProblemReportInput,
  toProblemReportValues,
} from './problem-report.schema';
import { ReportedDetails } from './ReportedDetails';
import type { ProblemReportRow } from './problem-report.types';

const CATEGORY_OPTIONS = enumOptions(PROBLEM_CATEGORIES);
const SEVERITY_OPTIONS = enumOptions(PROBLEM_SEVERITIES);
const STATUS_OPTIONS = enumOptions(PROBLEM_STATUSES);
const WHOLE_PLATFORM: SelectOption = { value: '', label: 'Whole platform' };
type Values = z.infer<typeof problemReportSchema>;

interface ProblemReportFormProps {
  initial: ProblemReportRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Triage form for one report. Editing keeps the reporter's own words in view; creating
 * is how Tech logs a problem someone raised by phone or email instead of on the page.
 */
export function ProblemReportForm({ initial, onDone, onCancel }: Readonly<ProblemReportFormProps>) {
  const [createReport] = useCreateProblemReportMutation();
  const [updateReport] = useUpdateProblemReportMutation();
  const { data } = useListStatusMonitorsQuery();
  const methods = useForm<z.input<typeof problemReportSchema>, unknown, Values>({
    resolver: zodResolver(problemReportSchema),
    defaultValues: toProblemReportValues(initial),
  });

  const monitors = data?.listStatusMonitors ?? [];
  const services: SelectOption[] = monitors.map((monitor) => ({
    value: monitor.key,
    label: monitor.name,
  }));
  const nameFor = (key: string) => monitors.find((monitor) => monitor.key === key)?.name ?? '';

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Problem report',
    initial,
    create: (values: Values) =>
      createReport({ variables: { input: toProblemReportInput(values, nameFor) } }),
    update: (row: ProblemReportRow, values: Values) =>
      updateReport({
        variables: { id: row.id, input: toProblemReportInput(values, nameFor) },
      }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      {initial && <ReportedDetails report={initial} />}
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfSelect name="severity" label="Severity" options={SEVERITY_OPTIONS} />
      <RhfTextField name="assignee" label="Assignee" helperText="Who is picking this up" />
      <RhfTextField
        name="resolutionNotes"
        label="Resolution notes"
        multiline
        rows={4}
        helperText="Required before a report can be resolved or closed"
      />
      <RhfSelect name="serviceKey" label="Service" options={[WHOLE_PLATFORM, ...services]} />
      <RhfSelect name="category" label="Type" options={CATEGORY_OPTIONS} />
      <RhfTextField name="subject" label="Title" />
      <RhfTextField name="description" label="What happened?" multiline rows={4} />
      <RhfTextField name="reporterName" label="Reported by" />
      <RhfTextField name="reporterEmail" label="Reporter email" />
      <RhfTextField name="pageUrl" label="Page address" />
    </EntityForm>
  );
}
