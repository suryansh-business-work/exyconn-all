import { z } from 'zod';
import {
  ComplianceCategory,
  ManagementStandard,
  ObjectiveFrequency,
  ObjectiveScope,
  ObjectiveStatus,
} from '@exyconn/shell/graphql/generated';
import type { ObjectiveRow } from './objective.types';

export const objectiveSchema = z
  .object({
    title: z.string().trim().min(1, 'Say what the objective is'),
    description: z.string().trim(),
    standards: z.array(z.nativeEnum(ManagementStandard)).min(1, 'Pick at least one standard'),
    category: z.nativeEnum(ComplianceCategory),
    scope: z.nativeEnum(ObjectiveScope),
    area: z.string().trim(),
    ownerId: z.string().trim(),
    ownerName: z.string().trim().min(1, 'An objective needs an owner'),
    measure: z.string().trim().min(1, 'Say how it is measured'),
    unit: z.string().trim(),
    baseline: z.coerce.number({ message: 'Baseline must be a number' }),
    target: z.coerce.number({ message: 'Target must be a number' }),
    actual: z.coerce.number({ message: 'Current value must be a number' }),
    frequency: z.nativeEnum(ObjectiveFrequency),
    periodStart: z.date({ message: 'Say when the period starts' }),
    periodEnd: z.date({ message: 'Say when the period ends' }),
    status: z.nativeEnum(ObjectiveStatus),
    plan: z.string().trim(),
  })
  // A period that ends before it starts would put the objective in no period at all, and
  // every progress figure read against it would be answering the wrong question.
  .refine((values) => values.periodEnd >= values.periodStart, {
    message: 'The period cannot end before it starts',
    path: ['periodEnd'],
  })
  // Baseline and target being equal asks for no movement, which is not an objective.
  .refine((values) => values.target !== values.baseline, {
    message: 'The target has to differ from the baseline, or there is nothing to achieve',
    path: ['target'],
  });

type Values = z.infer<typeof objectiveSchema>;

export function toObjectiveInput(values: Values) {
  return {
    ...values,
    periodStart: values.periodStart.toISOString(),
    periodEnd: values.periodEnd.toISOString(),
  };
}

export function toObjectiveValues(row: ObjectiveRow | null): Values {
  const now = new Date();
  return {
    title: row?.title ?? '',
    description: row?.description ?? '',
    standards: row?.standards ?? [],
    category: row?.category ?? ComplianceCategory.Quality,
    scope: row?.scope ?? ObjectiveScope.Company,
    area: row?.area ?? '',
    ownerId: row?.ownerId ?? '',
    ownerName: row?.ownerName ?? '',
    measure: row?.measure ?? '',
    unit: row?.unit ?? '',
    baseline: row?.baseline ?? 0,
    target: row?.target ?? 0,
    actual: row?.actual ?? 0,
    frequency: row?.frequency ?? ObjectiveFrequency.Quarterly,
    periodStart: row ? new Date(row.periodStart) : now,
    periodEnd: row ? new Date(row.periodEnd) : now,
    status: row?.status ?? ObjectiveStatus.Planned,
    plan: row?.plan ?? '',
  };
}
