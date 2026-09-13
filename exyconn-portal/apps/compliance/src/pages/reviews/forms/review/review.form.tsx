import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  RhfTextField,
  RhfSelect,
  RhfMultiSelect,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  ManagementReviewStatus,
  useCreateManagementReviewMutation,
  useUpdateManagementReviewMutation,
} from '@exyconn/shell/graphql/generated';
import { STANDARD_OPTIONS } from '../../../compliance.options';
import { ReviewActionFields } from './review-actions.fields';
import { reviewSchema, toReviewInput, toReviewValues } from './review.schema';
import type { ReviewRow } from './review.types';

const STATUS_OPTIONS = enumOptions(Object.values(ManagementReviewStatus));

type Values = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  initial: ReviewRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * The minute of a management review (clause 9.3).
 *
 * The inputs are typed out rather than pulled from the registers: the standard asks what
 * leadership CONSIDERED on the day, and a record that re-rendered from today's figures would
 * say something different every time somebody opened it.
 */
export function ReviewForm({ initial, onDone, onCancel }: Readonly<ReviewFormProps>) {
  const [createReview] = useCreateManagementReviewMutation();
  const [updateReview] = useUpdateManagementReviewMutation();
  const methods = useForm<z.input<typeof reviewSchema>, unknown, Values>({
    resolver: zodResolver(reviewSchema),
    defaultValues: toReviewValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Management review',
    initial,
    create: (v: Values) => createReview({ variables: { input: toReviewInput(v) } }),
    update: (row, v) => updateReview({ variables: { id: row.id, input: toReviewInput(v) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Review" helperText="e.g. Q3 management review" />
      <RhfMultiSelect name="standards" label="Standards" options={STANDARD_OPTIONS} />
      <RhfDatePicker name="heldOn" label="Held on" />
      <RhfTextField name="chairName" label="Chaired by" />
      <RhfTextField name="attendees" label="Attendees" multiline rows={2} />
      <RhfTextField
        name="inputs"
        label="What was considered"
        multiline
        rows={4}
        helperText="Audit results, objectives, findings, feedback, changes since last time"
      />
      <RhfTextField
        name="decisions"
        label="Decisions"
        multiline
        rows={4}
        helperText="What it concluded about the system's suitability, adequacy and effectiveness"
      />
      <ReviewActionFields />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
    </EntityForm>
  );
}
