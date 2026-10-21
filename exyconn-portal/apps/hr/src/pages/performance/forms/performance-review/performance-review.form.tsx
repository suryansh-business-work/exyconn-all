import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfAutocomplete } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ReviewStatus,
  useListUsersQuery,
  useCreatePerformanceReviewMutation,
  useUpdatePerformanceReviewMutation,
} from '@exyconn/shell/graphql/generated';
import type { PerformanceReviewRow } from './performance-review.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  cycle: z.string().trim().min(1, 'Cycle is required'),
  selfAssessment: z.string().trim().min(1, 'Self assessment is required'),
  managerAssessment: z.string().trim().min(1, 'Manager assessment is required'),
  competencies: z.string().trim().min(1, 'Competencies is required'),
  score: z.union([z.literal(''), z.coerce.number().min(0, 'Must be ≥ 0')]),
  rating: z.string().trim(),
  actionPlan: z.string().trim().min(1, 'Action plan is required'),
  status: z.enum(ReviewStatus),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: PerformanceReviewRow | null) => ({
  employeeId: row?.employeeId ?? '',
  cycle: row?.cycle ?? '',
  selfAssessment: row?.selfAssessment ?? '',
  managerAssessment: row?.managerAssessment ?? '',
  competencies: row?.competencies ?? '',
  score: row?.score ?? '',
  rating: row?.rating ?? '',
  actionPlan: row?.actionPlan ?? '',
  status: row?.status ?? Object.values(ReviewStatus)[0],
});

/** Empty optional inputs are "not set", which the API models as null. */
const toInput = (values: Values) => ({
  ...values,
  score: values.score === '' ? null : values.score,
  rating: values.rating === '' ? null : values.rating,
});

interface PerformanceReviewFormProps {
  initial: PerformanceReviewRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a review. */
export function PerformanceReviewForm({
  initial,
  onDone,
  onCancel,
}: Readonly<PerformanceReviewFormProps>) {
  const [createPerformanceReview] = useCreatePerformanceReviewMutation();
  const [updatePerformanceReview] = useUpdatePerformanceReviewMutation();
  const { data } = useListUsersQuery();

  const employeeOptions = (data?.listUsers ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'PerformanceReview',
    initial,
    create: (values: Values) => createPerformanceReview({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updatePerformanceReview({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete
        name="employeeId"
        label="Employee"
        options={employeeOptions}
        helperText="The employee being reviewed."
      />
      <RhfTextField
        name="cycle"
        label="Cycle"
        helperText="The review period, e.g. H1 2026 or FY 2025-26."
      />
      <RhfTextField
        name="selfAssessment"
        label="Self assessment"
        multiline
        minRows={3}
        helperText="The employee's own view of their work this cycle."
      />
      <RhfTextField
        name="managerAssessment"
        label="Manager assessment"
        multiline
        minRows={3}
        helperText="The manager's view of the employee's work this cycle."
      />
      <RhfTextField
        name="competencies"
        label="Competencies"
        multiline
        minRows={3}
        helperText="The skills assessed and how the employee did on each."
      />
      <RhfTextField
        name="score"
        label="Score (0-10)"
        type="number"
        helperText="Optional. An overall score from 0 to 10; leave empty until it is agreed."
      />
      <RhfTextField
        name="rating"
        label="Rating"
        helperText="Optional. A short overall label, e.g. Exceeds expectations."
      />
      <RhfTextField
        name="actionPlan"
        label="Action plan"
        multiline
        minRows={3}
        helperText="What the employee will work on before the next review."
      />
      <RhfSelect
        name="status"
        label="Status"
        options={enumOptions(Object.values(ReviewStatus))}
        helperText="Where the review is: open, self or manager assessment submitted, or closed."
      />
    </EntityForm>
  );
}
