import { z } from 'zod';
import { ManagementReviewStatus, ManagementStandard } from '@exyconn/shell/graphql/generated';
import type { ReviewRow } from './review.types';

const actionSchema = z.object({
  description: z.string().trim().min(1, 'Say what the action is'),
  ownerName: z.string().trim(),
  dueOn: z.date().nullable(),
  done: z.boolean(),
});

export const reviewSchema = z
  .object({
    title: z.string().trim().min(1, 'Name the review'),
    standards: z.array(z.nativeEnum(ManagementStandard)).min(1, 'Pick at least one standard'),
    heldOn: z.date({ message: 'Say when it was held' }),
    chairName: z.string().trim(),
    attendees: z.string().trim(),
    inputs: z.string().trim(),
    decisions: z.string().trim(),
    actions: z.array(actionSchema),
    status: z.nativeEnum(ManagementReviewStatus),
  })
  // A minute is the record of what was considered and decided, so it cannot be empty of both.
  .refine(
    (values) =>
      values.status !== ManagementReviewStatus.Minuted ||
      (values.inputs.length > 0 && values.decisions.length > 0),
    {
      message: 'A minuted review has to say what was considered and what was decided',
      path: ['decisions'],
    },
  );

type Values = z.infer<typeof reviewSchema>;

export function toReviewInput(values: Values) {
  return {
    ...values,
    heldOn: values.heldOn.toISOString(),
    actions: values.actions.map((action) => ({
      ...action,
      dueOn: action.dueOn ? action.dueOn.toISOString() : null,
    })),
  };
}

export function toReviewValues(row: ReviewRow | null): Values {
  return {
    title: row?.title ?? '',
    standards: row?.standards ?? [],
    heldOn: row ? new Date(row.heldOn) : new Date(),
    chairName: row?.chairName ?? '',
    attendees: row?.attendees ?? '',
    inputs: row?.inputs ?? '',
    decisions: row?.decisions ?? '',
    actions: (row?.actions ?? []).map((action) => ({
      description: action.description,
      ownerName: action.ownerName,
      dueOn: action.dueOn ? new Date(action.dueOn) : null,
      done: action.done,
    })),
    status: row?.status ?? ManagementReviewStatus.Planned,
  };
}
